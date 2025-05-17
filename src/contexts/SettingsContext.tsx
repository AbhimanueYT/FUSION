import React, { createContext, useContext, useState, useEffect } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../lib/supabase';

import { useAuth } from '../contexts/AuthContext';



interface Settings {

  notificationsEnabled: boolean;

  reminderTime: string; // 24h format "HH:mm"

  defaultPriority: 'low' | 'medium' | 'high';

  showCompletedTasks: boolean;

}



interface SettingsContextType {

  settings: Settings;

  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;

  loading: boolean;

}



const defaultSettings: Settings = {

  notificationsEnabled: true,

  reminderTime: "09:00",

  defaultPriority: 'medium',

  showCompletedTasks: true,

};



const SettingsContext = createContext<SettingsContextType | undefined>(undefined);



export function SettingsProvider({ children }: { children: React.ReactNode }) {

  const { user } = useAuth();

  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    loadSettings();

  }, [user?.id]);



  const loadSettings = async () => {

    try {

      if (!user) {

        const localSettings = await AsyncStorage.getItem('settings');

        if (localSettings) {

          setSettings(JSON.parse(localSettings));

        }

      } else {

        // First try to get existing settings

        const { data: existingSettings, error: fetchError } = await supabase

          .from('user_settings')

          .select('settings')

          .eq('user_id', user.id)

          .single();



        if (fetchError && fetchError.code !== 'PGRST116') {

          throw fetchError;

        }



        if (existingSettings) {

          setSettings({ ...defaultSettings, ...existingSettings.settings });

        } else {

          // Create new settings only if none exist

          const { data, error } = await supabase

            .from('user_settings')

            .insert([{ 

              user_id: user.id, 

              settings: defaultSettings 

            }])

            .select('settings')

            .single();



          if (error) throw error;

          if (data) {

            setSettings({ ...defaultSettings, ...data.settings });

          }

        }

      }

    } catch (error) {

      console.error('Error loading settings:', error);

    } finally {

      setLoading(false);

    }

  };



  const updateSettings = async (newSettings: Partial<Settings>) => {

    try {

      const updatedSettings = { ...settings, ...newSettings };

      setSettings(updatedSettings);

  

      if (!user) {

        await AsyncStorage.setItem('settings', JSON.stringify(updatedSettings));

      } else {

        const { error } = await supabase

          .from('user_settings')

          .update({ 

            settings: updatedSettings,

            updated_at: new Date().toISOString()

          })

          .eq('user_id', user.id);

  

        if (error) throw error;

      }

    } catch (error) {

      console.error('Error updating settings:', error);

      setSettings(settings); // Revert on error

      throw error;

    }

  }; 



  return (

    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>

      {children}

    </SettingsContext.Provider>

  );

}



export function useSettings() {

  const context = useContext(SettingsContext);

  if (!context) {

    throw new Error('useSettings must be used within a SettingsProvider');

  }

  return context;

}