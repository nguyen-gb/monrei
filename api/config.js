module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  res.status(200).json({
    email: process.env.CONTACT_TO_EMAIL || 'caonguyenthuthao630@gmail.com',
    phone: process.env.CONTACT_PHONE || '0909364603',
  });
};
