import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function seed() {
  for (let i = 1; i <= 3; i++) {
    const email = `seed_user_${i}@example.com`;
    const password = 'StrongPassw0rd!123';
    console.log(`Signing up ${email}...`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: `Seed User ${i}`,
          age: 25,
          bio: 'I am a seed user.',
          gender: 'autre',
          budget: 500,
          smoker: false,
          has_pets: false,
          onboarded: true
        }
      }
    });

    if (error) {
      console.error('Error signing up:', error.message);
    } else {
      console.log('Success:', data.user?.id);
    }
  }
}

seed();
