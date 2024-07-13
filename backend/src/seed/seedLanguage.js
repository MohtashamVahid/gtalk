const mongoose = require('mongoose');
const Language = require('./models/Language'); // فرض کنید مدل Language در مسیر models/Language.js است

const languages = [
    { name: 'English', code: 'en' },
    { name: 'Persian', code: 'fa' },
    { name: 'German', code: 'de' },
    { name: 'French', code: 'fr' },
    { name: 'Spanish', code: 'es' },
    { name: 'Italian', code: 'it' },
    { name: 'Russian', code: 'ru' },
    { name: 'Chinese', code: 'zh' },
    { name: 'Japanese', code: 'ja' },
    { name: 'Arabic', code: 'ar' },
    { name: 'Turkish', code: 'tr' },
    { name: 'Korean', code: 'ko' }
];

async function seedDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/yourDatabaseName', { useNewUrlParser: true, useUnifiedTopology: true });

        const count = await Language.countDocuments();
        if (count === 0) {
            await Language.insertMany(languages);
            console.log('Database seeded with initial language data.');
        } else {
            console.log('Database already contains language data. No action taken.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding database:', error);
        mongoose.connection.close();
    }
}

seedDatabase();
