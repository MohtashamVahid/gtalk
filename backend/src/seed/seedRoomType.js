const mongoose = require('mongoose');
const Type = require('../models/RoomType'); // فرض کنید مدل Type در مسیر models/Type.js است

const types = [
    { name: 'food', description: 'Discussions about food and cooking' },
    { name: 'medical', description: 'Medical and health-related topics' },
    { name: 'general', description: 'General topics' },
    { name: 'technology', description: 'Technology and computers' },
    { name: 'science', description: 'Science and research' },
    { name: 'art', description: 'Art and music' },
    { name: 'movies', description: 'Movies and cinema' },
    { name: 'books', description: 'Books and literature' },
    { name: 'travel', description: 'Travel and tourism' },
    { name: 'business', description: 'Business and entrepreneurship' },
    { name: 'education', description: 'Education and learning' },
    { name: 'family', description: 'Family and relationships' },
    { name: 'religion', description: 'Religion and philosophy' },
    { name: 'entertainment', description: 'Entertainment and games' },
    { name: 'environment', description: 'Environment and nature' },
    { name: 'politics', description: 'Politics and government' },
    { name: 'fashion', description: 'Fashion and beauty' },
    { name: 'automotive', description: 'Cars and motorcycles' },
    { name: 'pets', description: 'Pets and wildlife' },
    { name: 'psychology', description: 'Psychology and personal growth' }
];

async function seedDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/yourDatabaseName', { useNewUrlParser: true, useUnifiedTopology: true });

        const count = await Type.countDocuments();
        if (count === 0) {
            await Type.insertMany(types);
            console.log('Database seeded with initial data.');
        } else {
            console.log('Database already contains data. No action taken.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding database:', error);
        mongoose.connection.close();
    }
}

seedDatabase();
