import { ROUTES } from '../navigation/routes.js';

export function routeByRole(navigation, user) {
  if (!user) {
    navigation.navigate(ROUTES.LOGIN);
    return;
  }
  if (user.role === 'SUPER_ADMIN') navigation.navigate(ROUTES.SUPER_ADMIN);
  else if (user.role === 'ADMIN') navigation.navigate(ROUTES.ADMIN);
  else navigation.navigate(ROUTES.USER);
}
