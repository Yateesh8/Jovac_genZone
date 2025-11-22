const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = 'mongodb+srv://yateeshGangwar:yateesh%401221@cluster1.qjzwxfe.mongodb.net/genzone?retryWrites=true&w=majority';
    
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
