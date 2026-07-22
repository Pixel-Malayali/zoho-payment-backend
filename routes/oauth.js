router.get('/oauth/start', (req, res) => {
  const scope = 'ZohoPay.payments.CREATE,ZohoPay.payments.READ';
  const soid = `zohopay.${process.env.ZOHO_ACCOUNT_ID}`;

  const authUrl =
    `https://accounts.zoho.in/oauth/v2/org/auth` +
    `?response_type=code` +
    `&client_id=${process.env.ZOHO_CLIENT_ID}` +
    `&soid=${soid}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&redirect_uri=${encodeURIComponent(process.env.BASE_URL + '/oauth/callback')}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.redirect(authUrl);
});
