import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://supabase.com/dashboard/project/jyduhfocymojtzezysvx',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZHVoZm9jeW1vanR6ZXp5c3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTc2MjksImV4cCI6MjA4MDY5MzYyOX0.eXb89IC_KQPpBUIo0eODYVR1IoCDEJzZ4D7ys_d8njs'
);

// Test sign up
async function testConnection() {
    const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123'
    });

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Success! User:', data.user);
    }
}

testConnection();