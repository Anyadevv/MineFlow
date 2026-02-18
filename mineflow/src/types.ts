import React from 'react';

export interface Plan {
  id: string;
  name: string;
  percent: number;
  dailyProfit: number;
  durationDays: number;
  minDeposit: number;
  maxDeposit: number | 'Unlimited';
  minerModel?: string;
  minerImage?: string;
  isPopular?: boolean;
}

export interface BountyTask {
  id: string;
  platform: string;
  description: string;
  requirements: string[];
  rewardRange: string;
  icon: React.ReactNode;
}

export interface StatRow {
  id: string;
  user: string;
  amount: number;
  date: string;
  timestamp?: number;
  currency: string;
}

export interface PartnerRow {
  id: string;
  user: string;
  referrals: number;
}

export interface User {
  email: string;
  name: string;
  balance: {
    deposit: number;
    earning: number;
  };
  stats: {
    activePlans: number;
    totalInvested: number;
    totalEarnings: number;
    referrals: number;
  };
}

export interface UserPlan {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  daily_percent: number;
  duration_days: number;
  total_profit: number;
  total_return: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}