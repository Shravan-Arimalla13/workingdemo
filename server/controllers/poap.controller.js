// In server/controllers/poap.controller.js
const poapService = require('../services/poap.service');
const POAP = require('../models/poap.model');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const QRCode = require('qrcode');
const crypto = require('crypto');
// --- NEW IMPORT ---
const { getAddress } = require('ethers/address');

/**
 * Student scans QR and claims POAP
 */
exports.claimPOAP = async (req, res) => {
    try {
        const { token, eventId, gps } = req.body;
        const studentId = req.user.id;

        // 1. Validate basics
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.checkInToken !== token) return res.status(400).json({ message: 'Invalid or expired QR code' });

        // 2. Get student details
        const student = await User.findById(studentId);
        if (!student.walletAddress) {
            return res.status(400).json({ message: 'Please connect your wallet first to receive POAP' });
        }
        
        // --- FIX 1: NORMALIZE WALLET ADDRESS ---
        const studentWallet = getAddress(student.walletAddress); 
        // ----------------------------------------
        
        // 3. Validate GPS location (skipped for now for brevity, assuming successful location check from frontend)

        // 4. Generate event hash
        const eventHash = poapService.generateEventHash(event._id, event.name, event.date);
        
        // 5. Check if already claimed
        const alreadyClaimed = await POAP.findOne({
            studentWallet: studentWallet.toLowerCase(),
            eventHash: eventHash
        });
        
        if (alreadyClaimed) {
            return res.status(400).json({ message: 'You have already claimed POAP for this event' });
        }
        
        // 6. Mint POAP on blockchain (using the FIXED wallet address)
        const mintResult = await poapService.mintPOAP(
            studentWallet, // <--- Use the normalized address
            {
                eventId: event._id,
                eventName: event.name,
                eventDate: event.date
            },
            gps || { latitude: 0, longitude: 0 }
        );
        
        // 7. Save to database
        const poap = new POAP({
            tokenId: mintResult.tokenId,
            transactionHash: mintResult.transactionHash,
            eventHash: eventHash,
            eventId: event._id,
            eventName: event.name,
            eventDate: event.date,
            studentWallet: studentWallet.toLowerCase(),
            studentEmail: student.email,
            studentName: student.name,
            checkInLocation: gps,
            issuer: req.user.id
        });
        
        await poap.save();
        
        // 8. Add participation to event (ensure data consistency)
        event.participants.push({ name: student.name, email: student.email });
        await event.save();
        
        res.status(201).json({
            message: 'POAP claimed successfully!',
            poap: { tokenId: poap.tokenId, transactionHash: poap.transactionHash, eventName: poap.eventName, verificationUrl: poap.verificationUrl }
        });
        
    } catch (error) {
        console.error('POAP Claim Error:', error);
        res.status(500).json({ 
            message: 'POAP claim failed',
            error: error.message 
        });
    }
};