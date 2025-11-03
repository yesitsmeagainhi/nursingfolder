// src/navigation/navRef.ts
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function go(name: string, params?: Record<string, any>) {
    if (navigationRef.isReady()) {
        // types are "never" for safety in RN v6
        navigationRef.navigate(name as never, (params || {}) as never);
    }
}
