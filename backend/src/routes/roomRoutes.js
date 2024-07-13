const express = require('express');
const router = express.Router();
const { createRoom, getAllRooms, getRoomById, addAdminToRoom, removeMemberFromRoom, updateRoomSettings } = require('../controllers/roomController');
const roomMiddleware = require('../middlewares/roomMiddleware');
const authenticateJWT = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Room details
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             description:
 *               type: string
 *             userId:
 *               type: string
 *             admins:
 *               type: array
 *               items:
 *                 type: string
 *             maxMembers:
 *               type: integer
 *             maxSpeakers:
 *               type: integer
 *             languageId:
 *               type: string
 *             topic:
 *               type: string
 *             rules:
 *               type: string
 *     responses:
 *       201:
 *         description: Room created successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             room:
 *               $ref: '#/definitions/Room'
 *       400:
 *         description: Missing required fields or invalid data
 *       404:
 *         description: User not found
 */
router.post('/rooms',authenticateJWT, roomMiddleware.checkGroupCreationRestriction, createRoom);

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms
 *     tags:
 *       - Rooms
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
router.get('/',authenticateJWT, getAllRooms);


/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     tags:
 *       - Rooms
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the room to get
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Room found
 *         schema:
 *           $ref: '#/definitions/Room'
 *       404:
 *         description: Room not found
 */
router.get('/rooms/:id',authenticateJWT, getRoomById);

/**
 * @swagger
 * /api/rooms/addAdmin:
 *   post:
 *     summary: Add admin to room
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Admin details
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             roomId:
 *               type: string
 *             userId:
 *               type: string
 *             adminId:
 *               type: string
 *     responses:
 *       200:
 *         description: User added as admin successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             room:
 *               $ref: '#/definitions/Room'
 *       400:
 *         description: User is already an admin of this room or invalid data
 *       403:
 *         description: Only admins can add other admins
 *       404:
 *         description: Room not found
 */
router.post('/addAdmin',authenticateJWT, roomMiddleware.validateRoomId, roomMiddleware.checkUserAccess, addAdminToRoom);

/**
 * @swagger
 * /api/rooms/removeMember:
 *   post:
 *     summary: Remove member from room
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Member details
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             roomId:
 *               type: string
 *             userId:
 *               type: string
 *             adminId:
 *               type: string
 *     responses:
 *       200:
 *         description: User removed from room successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             room:
 *               $ref: '#/definitions/Room'
 *       400:
 *         description: User is not a member of this room or invalid data
 *       403:
 *         description: Only admins can remove members
 *       404:
 *         description: Room not found
 */
router.post('/removeMember',authenticateJWT, roomMiddleware.validateRoomId, roomMiddleware.checkUserAccess, removeMemberFromRoom);

/**
 * @swagger
 * /api/rooms/updateSettings:
 *   put:
 *     summary: Update room settings
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Updated settings
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             roomId:
 *               type: string
 *             maxMembers:
 *               type: integer
 *             maxSpeakers:
 *               type: integer
 *             languageId:
 *               type: string
 *             topic:
 *               type: string
 *             rules:
 *               type: string
 *     responses:
 *       200:
 *         description: Room settings updated successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             room:
 *               $ref: '#/definitions/Room'
 *       400:
 *         description: Invalid data or missing required fields
 *       403:
 *         description: Unauthorized to update room settings
 *       404:
 *         description: Room not found
 */
router.put('/updateSettings',authenticateJWT, roomMiddleware.validateRoomId, roomMiddleware.checkUserAccess, updateRoomSettings);

module.exports = router;
