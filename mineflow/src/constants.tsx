import React from 'react';
import { Plan, BountyTask, StatRow, PartnerRow } from './types';
import { Twitter, Youtube, FileText, Facebook } from 'lucide-react';

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    percent: 120,
    dailyProfit: 6,
    durationDays: 20,
    minDeposit: 1,
    maxDeposit: 99,
    isPopular: false,
    minerModel: 'Antminer S19 Pro',
    minerImage: '/antminer_new.png',
  },
  {
    id: 'professional',
    name: 'Professional',
    percent: 160,
    dailyProfit: 8,
    durationDays: 20,
    minDeposit: 100,
    maxDeposit: 999,
    isPopular: true,
    minerModel: 'Whatsminer M50',
    minerImage: '/whatsminer_new.png',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    percent: 200,
    dailyProfit: 10,
    durationDays: 20,
    minDeposit: 1000,
    maxDeposit: 'Unlimited',
    isPopular: false,
    minerModel: 'AvalonMiner 1246',
    minerImage: '/avalon_new.png',
  },
];

export const BOUNTY_TASKS: BountyTask[] = [
  {
    id: 'youtube',
    platform: 'YouTube Review',
    description: 'Create a video review of our platform explaining your experience.',
    requirements: [
      'Video must be at least 3 minutes long',
      'Must show deposit or withdrawal proof',
      'Include referral link in description',
      'Channel must have 100+ subscribers'
    ],
    rewardRange: '$5 - $500',
    icon: <Youtube className="w-8 h-8 text-red-500" />
  },
  {
    id: 'blog',
    platform: 'Blog Post',
    description: 'Write a detailed article about MineFlow on your personal blog or Medium.',
    requirements: [
      'Minimum 500 words',
      'Unique content (no copy-paste)',
      'Include 2+ images of the platform',
      'Publicly accessible link'
    ],
    rewardRange: '$5 - $200',
    icon: <FileText className="w-8 h-8 text-blue-500" />
  },
  {
    id: 'social',
    platform: 'Social Media',
    description: 'Post about us on Twitter, Facebook or Telegram.',
    requirements: [
      'Account must be public',
      'Use hashtags #MineFlow #CryptoMining',
      'Tag our official account',
      'Only one submission per week'
    ],
    rewardRange: '$2 - $50',
    icon: <Twitter className="w-8 h-8 text-sky-500" />
  },
];

export const FAQS = [
  {
    q: "How does crypto mining work?",
    a: "Crypto mining involves using computer hardware to solve complex mathematical problems that verify transactions on the blockchain. In return for this service, miners are rewarded with cryptocurrency."
  },
  {
    q: "When can I withdraw my earnings?",
    a: "You can withdraw your earnings instantly once your account balance reaches the minimum withdrawal amount of $10. Withdrawals are processed automatically."
  },
  {
    q: "What payment methods do you accept?",
    a: "We currently accept Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), and Tether (USDT TRC20). More options will be added soon."
  },
  {
    q: "Is my investment secure?",
    a: "Yes, we use advanced encryption and cold storage for the majority of funds. Our mining farms are distributed globally to minimize risk."
  },
  {
    q: "How do I get started?",
    a: "Simply create an account, choose an investment plan that suits your goals, make a deposit, and your mining operations will start automatically."
  }
];

export const MOCK_PAYOUTS: StatRow[] = [
  { id: '1', user: 'User99600', amount: 2.53, date: '13 Jan 2026 - 16:47', currency: 'USD' },
  { id: '2', user: 'User37804', amount: 5.41, date: '13 Jan 2026 - 16:28', currency: 'USD' },
  { id: '3', user: 'User30210', amount: 5.00, date: '13 Jan 2026 - 16:26', currency: 'USD' },
  { id: '4', user: 'User69218', amount: 13.00, date: '13 Jan 2026 - 16:07', currency: 'USD' },
  { id: '5', user: 'User89685', amount: 2.00, date: '13 Jan 2026 - 14:50', currency: 'USD' },
];

export const MOCK_DEPOSITS: StatRow[] = [
  { id: '1', user: 'User93677', amount: 7573.11, date: 'Today', currency: 'USD' },
  { id: '2', user: 'User58647', amount: 6523.34, date: 'Today', currency: 'USD' },
  { id: '3', user: 'User24417', amount: 6332.13, date: 'Today', currency: 'USD' },
  { id: '4', user: 'User61820', amount: 3664.86, date: 'Today', currency: 'USD' },
  { id: '5', user: 'User42317', amount: 3461.25, date: 'Today', currency: 'USD' },
];

export const MOCK_PARTNERS: PartnerRow[] = [
  { id: '1', user: 'User94821', referrals: 681 },
  { id: '2', user: 'User33902', referrals: 543 },
  { id: '3', user: 'User77124', referrals: 412 },
  { id: '4', user: 'User21099', referrals: 297 },
  { id: '5', user: 'User55812', referrals: 184 },
];