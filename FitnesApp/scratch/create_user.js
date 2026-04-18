const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://asihntqqeipaxsdilkyv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaWhudHFxZWlwYXhzZGlsa3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxODk2NzgsImV4cCI6MjA5MTc2NTY3OH0.S_2RD2xbWLvJTFj2sMdby0n1aHw8KbCrbvbuI2tYkFE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  console.log('Попытка создания пользователя: ribosomov92@mail.ru...');
  
  const { data, error } = await supabase.auth.signUp({
    email: 'ribosomov92@mail.ru',
    password: '123qweasd',
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('Пользователь уже существует.');
    } else {
      console.error('Ошибка при создании:', error.message);
      return;
    }
  } else {
    console.log('Пользователь успешно зарегистрирован (проверьте почту, если требуется).');
  }

  // Даже если пользователь был создан ранее, попробуем создать/обновить профиль
  if (data && data.user) {
    console.log('Обновление профиля для ID:', data.user.id);
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        full_name: 'Тестовый Пользователь',
        onboarding_data: { onboarding_completed: true }
      });
      
    if (profileError) {
      console.error('Ошибка профиля:', profileError.message);
    } else {
      console.log('Профиль успешно настроен.');
    }
  }
}

createUser();
