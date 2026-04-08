import { pgEnum } from 'drizzle-orm/pg-core'
import { REQUEST_TYPE } from '@/constants/enums'

export const requestType = pgEnum(
  'request_type',
  REQUEST_TYPE.map((group) => group.value) as [string, ...Array<string>],
)
