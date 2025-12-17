/**
 * Payment Routes
 * Handle payments using Stripe
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create payment intent (for call payment)
 * POST /api/payments/create-intent
 */
router.post('/create-intent', async (req, res) => {
  try {
    const { callId, amount, currency = 'gel' } = req.body;

    // Convert GEL to minor units (tetri)
    const amountInMinorUnits = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInMinorUnits,
      currency: currency.toLowerCase(),
      metadata: {
        callId,
        platform: 'geolingua'
      }
    });

    // Save payment record
    await supabase
      .from('payments')
      .insert({
        call_id: callId,
        stripe_payment_intent_id: paymentIntent.id,
        amount,
        currency,
        status: 'pending'
      });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'გადახდის შეცდომა' });
  }
});

/**
 * Confirm payment success
 * POST /api/payments/confirm
 */
router.post('/confirm', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update payment record
      await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      res.json({
        success: true,
        message: 'გადახდა წარმატებით დასრულდა'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'გადახდა ვერ დადასტურდა',
        status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'გადახდის დადასტურების შეცდომა' });
  }
});

/**
 * Get user's payment history
 * GET /api/payments/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        call:call_id (
          duration,
          request:request_id (
            from_lang,
            to_lang,
            category
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ payments });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'გადახდების ისტორიის შეცდომა' });
  }
});

/**
 * Get translator's earnings
 * GET /api/payments/translator/:translatorId/earnings
 */
router.get('/translator/:translatorId/earnings', async (req, res) => {
  try {
    const { translatorId } = req.params;
    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const { data: calls, error } = await supabase
      .from('calls')
      .select('translator_earnings, created_at')
      .eq('translator_id', translatorId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const totalEarnings = calls.reduce((sum, c) => sum + (c.translator_earnings || 0), 0);
    const callCount = calls.length;

    res.json({
      period,
      totalEarnings: totalEarnings.toFixed(2),
      callCount,
      avgPerCall: callCount > 0 ? (totalEarnings / callCount).toFixed(2) : '0.00'
    });

  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'შემოსავლის მიღების შეცდომა' });
  }
});

/**
 * Request payout (for translators)
 * POST /api/payments/payout
 */
router.post('/payout', async (req, res) => {
  try {
    const { translatorId, amount, method, details } = req.body;

    // Validate minimum payout
    if (amount < 50) {
      return res.status(400).json({ 
        error: 'მინიმალური გატანის თანხა არის 50₾' 
      });
    }

    // Check available balance
    const { data: calls } = await supabase
      .from('calls')
      .select('translator_earnings')
      .eq('translator_id', translatorId)
      .eq('status', 'completed')
      .eq('payout_status', 'pending');

    const availableBalance = calls.reduce((sum, c) => sum + (c.translator_earnings || 0), 0);

    if (amount > availableBalance) {
      return res.status(400).json({ 
        error: `არასაკმარისი ბალანსი. ხელმისაწვდომია: ${availableBalance.toFixed(2)}₾` 
      });
    }

    // Create payout request
    const { data: payout, error } = await supabase
      .from('payouts')
      .insert({
        translator_id: translatorId,
        amount,
        method, // 'bank', 'paypal', 'wise'
        details, // account info
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'გატანის მოთხოვნა მიღებულია',
      payout
    });

  } catch (error) {
    console.error('Payout request error:', error);
    res.status(500).json({ error: 'გატანის მოთხოვნის შეცდომა' });
  }
});

module.exports = router;
