export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}
