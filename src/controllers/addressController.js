const Address = require('../models/Address');

const getAddressesByUserId = async (userId) => {
    try {
        // Assuming you have a database model for addresses, e.g., Address
        const addresses = await Address.find({ userId: userId }); // Query the database for addresses with the user's ID
        return addresses;
    } catch (err) {
        console.error('Error fetching addresses by user ID:', err);
        throw new Error('Unable to fetch addresses');
    }
};

// Add a new address
const createAddress = async (addressData) => {
    const newAddress = new Address(addressData);
    return await newAddress.save();
};

// Update an existing address
const updateAddressById = async (id, updatedData) => {
    return await Address.findByIdAndUpdate(id, updatedData, { new: true });
};

// Delete an address by ID
const deleteAddressById = async (id) => {
    return await Address.findByIdAndDelete(id);
};

module.exports = {
    getAddressesByUserId,
    createAddress,
    updateAddressById,
    deleteAddressById,
};
