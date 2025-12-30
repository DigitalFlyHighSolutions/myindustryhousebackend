const userRepository = require('../repositories/userRepository');

exports.getAllUsers = async (req, res) => {
    try {
        console.log("🔥 [USERS] /users hit, query:", req.query);

        const users = await userRepository.findAll(req.query);

        console.log("🔥 [USERS] fetched users count:", users.length);

        res.status(200).json(users);
    } catch (err) {
        console.error("❌ [USERS] Error getting users:", err.message);
        console.error(err.stack);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};


exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userRepository.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error("Error getting user:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.createUser = async (req, res) => {
    try {
        console.log("Received data in user-service:", req.body); // Add this line
        const { email } = req.body;
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: "User already exists." });
        }
        const [newUser] = await userRepository.create(req.body);
        res.status(201).json(newUser);
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedUser] = await userRepository.update(id, req.body);
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await userRepository.remove(id);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(204).send();
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: "Server Error" });
    }
};