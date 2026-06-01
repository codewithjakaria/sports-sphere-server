// export const auth = betterAuth({
//   database: mongodbAdapter(db),
//   emailAndPassword: { enabled: true },
//   baseURL: process.env.BETTER_AUTH_URL,
//   secret: process.env.BETTER_AUTH_SECRET,
//   trustedOrigins: [process.env.CLIENT_URL], // এটি নিশ্চিত করুন রেন্ডারে সেট করা আছে

//   // এই অংশটি মিসিং ছিল, তাই এরর দিচ্ছিল
//   socialProviders: {
//     google: {
//       clientId: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     },
//   },

//   advanced: {
//     crossSubdomainCookies: {
//       enabled: false,
//     },
//     defaultCookieAttributes: {
//       secure: true,
//       httpOnly: true,
//       sameSite: 'none',
//       partitioned: true, // ক্রস-অরিজিন কুকির জন্য এটি খুব গুরুত্বপূর্ণ
//     },
//   },
// });

import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { client } from './db'; // আপনার মঙ্গোডিবি ক্লায়েন্ট

export const auth = betterAuth({
  database: mongodbAdapter(client.db('Sports-Sphere')),
  emailAndPassword: { enabled: true },
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  // এটি কনস্ট্রাক্টরের ভেতরে সরাসরি এভাবে লিখুন
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  // বাকি advanced সেটিংস এখানে রাখুন...
});