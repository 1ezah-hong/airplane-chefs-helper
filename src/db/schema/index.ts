export * from './airports';
export * from './levels';
export * from './food-categories';
export * from './foods';
export * from './souvenirs';

import { airports } from './airports';
import { foodCategories } from './food-categories';
import { foods } from './foods';
import { levels } from './levels';
import { souvenirs } from './souvenirs';

export const schema = { airports, levels, foodCategories, foods, souvenirs };
