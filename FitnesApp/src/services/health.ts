import AppleHealthKit, {
  HealthKitPermissions,
} from 'react-native-health';
import { Platform } from 'react-native';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.Steps],
    write: [],
  },
};

export const initHealthKit = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'ios') {
      return resolve();
    }

    AppleHealthKit.initHealthKit(permissions, (error) => {
      if (error) {
        console.error('[HealthKit] Initialization failed:', error);
        return reject(error);
      }
      resolve();
    });
  });
};

export const getStepsToday = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'ios') {
      return resolve(0); // For now, return 0 for non-iOS
    }

    const options = {
      date: new Date().toISOString(),
    };

    AppleHealthKit.getStepCount(options, (err, results) => {
      if (err) {
        console.error('[HealthKit] Error fetching steps:', err);
        return resolve(0); // Return 0 instead of crashing
      }
      resolve(results.value);
    });
  });
};
