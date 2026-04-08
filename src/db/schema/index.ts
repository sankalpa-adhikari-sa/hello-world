import * as activeDevelopment from './active_development_projects.schema'
import * as internal from './auth.schema'
import * as enums from './enums.schema'
import * as fundAProject from './fund_a_project.schema'
import * as general from './quick_links.schema'
import * as organization from './organization.schema'
import * as request from './request.schema'
import * as survey from './survey.schema'
import * as tags from './tags.schema'

export const schema = {
  ...enums,
  ...general,
  ...internal,
  ...organization,
  ...tags,
  ...fundAProject,
  ...request,
  ...survey,
  ...activeDevelopment,
}
