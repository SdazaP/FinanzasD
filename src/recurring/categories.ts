import { mergeCategories as merge } from '../lib/categories'

export { categoryError } from '../lib/categories'

export const defaultCategories = ['Vivienda', 'Servicios', 'Transporte', 'Entretenimiento', 'Salud', 'Educación', 'Otros']

export const mergeCategories = (custom: string[]) => merge(custom, defaultCategories)
