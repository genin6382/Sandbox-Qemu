/**This file is used to implement the logic for /users functionalities */
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { registerUser as saveUser, findUserByName } from "../repositories/adminRepository";
import prisma from '../database/prisma'

const SALT_ROUNDS = 10;

/**Register new user using given username and password using Hashing */
export async function registerUser(req: Request, res: Response) {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
        return res.status(400).json({ message: "Name and password are required" });
        }

        const existingUser = await findUserByName(name);
        if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await saveUser(name, hashedPassword);

        return res.status(201).json({
        message: "User registered successfully",
        user: { id: user.id, name: user.name },
        });
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
/**Login function, checks if given username matches the password */
export async function loginUser(req: Request, res: Response) {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
        return res.status(400).json({ message: "Name and password are required" ,success:false});
        }

        const user = await findUserByName(name);
        if (!user) {
            return res.status(404).json({ message: "User not found" ,success:false});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" ,success:false});
        }

        return res.status(200).json({
            message: "Login successful",
            userId: user.id,
            name: user.name,
            success:true
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Internal server error",success:false });
    }
}

/**Used for analytical purpose , Returns Count of (isos,images,nodes,status) */
export async function getSummary(req:Request, res:Response) {
    try {
        const isosCount = await prisma.iSOs.count();

        const imagesCount = await prisma.images.count();

        const nodesCount = await prisma.nodes.count();

        const runningNodesCount = await prisma.nodes.count({
        where: { status: 'RUNNING' }
        });

        const idleNodesCount = await prisma.nodes.count({
        where: { status: 'IDLE' }
        });

        res.json({
        isosCount,
        imagesCount,
        nodesCount,
        runningNodesCount,
        idleNodesCount
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
}