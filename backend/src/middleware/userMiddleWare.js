const User = require('../models/User'); // مسیر مدل User خود را به درستی تنظیم کنید
const UserRestriction = require('../models/UserRestriction');
const user = require('../models/User');

async function checkUserFields(req, res, next) {
    const { username, email, phone, bazaar_accountId, device_id } = req.body;

    try {
        // چک کردن فیلد username
        if (username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: 'نام کاربری وارد شده قبلاً ثبت شده است.' });
            }
        }

        // چک کردن فیلد email
        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'ایمیل وارد شده قبلاً ثبت شده است.' });
            }
        }

        // چک کردن فیلد phone
        if (phone) {
            const existingUser = await User.findOne({ phone });
            if (existingUser) {
                return res.status(400).json({ error: 'شماره تلفن وارد شده قبلاً ثبت شده است.' });
            }
        }

        // چک کردن فیلد bazaar_accountId
        if (bazaar_accountId) {
            const existingUser = await User.findOne({ bazaar_accountId });
            if (existingUser) {
                return res.status(400).json({ error: 'شناسه بازار وارد شده قبلاً ثبت شده است.' });
            }
        }


        if (device_id) {
            const existingUser = await User.findOne({ device_id });
            if (existingUser) {
                return res.status(400).json({ error: 'این دستگاه قبلاً از دوره آزمایشی استفاده کرده است.' });
            }
        }


        // اگر همه فیلدها چک شدند و مشکلی نبود، به مرحله بعد برو
        next();
    } catch (err) {
        return res.status(500).json({ error: 'خطایی در سرور رخ داده است.' });
    }
}

const checkUserRestriction = async (req, res, next) => {
  const userId = req.user && req.user._id;

  try {
    if (!userId) {
      return res.status(403).json({ message: 'شناسه کاربر نامعتبر است.' });
    }

    const restriction = await UserRestriction.findOne({ user: userId }).sort({ createdAt: -1 });

    if (!restriction) {
      return next();
    }

    if (restriction.expiresAt < new Date()) {
      await UserRestriction.findByIdAndDelete(restriction._id);
      return next();
    }

    // محاسبه زمان باقی‌مانده
    const timeRemaining = getTimeRemaining(restriction.expiresAt);
    const message = `شما تا تاریخ ${restriction.expiresAt.toLocaleDateString()} و ساعت ${restriction.expiresAt.toLocaleTimeString()} برای انجام این عملیات محدود شده‌اید. لطفاً پس از این زمان مجدداً تلاش کنید.`;

    return res.status(403).json({ message, timeRemaining });

  } catch (error) {
    console.error('خطا در بررسی محدودیت کاربر:', error);
    return res.status(500).json({ message: 'خطا در بررسی محدودیت کاربر' });
  }
};

function getTimeRemaining(expiryDate) {
  const currentTime = new Date();
  const timeDiff = expiryDate - currentTime;

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  return `${days} روز، ${hours} ساعت و ${minutes} دقیقه`;
}




module.exports = { checkUserFields ,checkUserRestriction};
