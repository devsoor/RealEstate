// ability.js
import { Ability, AbilityBuilder } from '@casl/ability'


export function defineAbilitiesFor(idToken) {
    const roles = idToken.payload['cognito:groups'] || [];
    const isSysAdmin = roles.includes("administrators");
    const isSiteAdmin = roles.includes("site_admin");
    const isSiteMember = roles.includes("site_member");

    return AbilityBuilder.define((can, cannot) => {
      if (isSysAdmin) {
        can('manage', 'all')
        can('create', 'tenant')
        can('update', 'tenant')
      } 
      else if (isSiteAdmin) {
        can('manage', 'site')
        can('manage', 'siteassumptions')
        can('update', 'billing')
        can('update', 'tenant')
        can('manage', 'users')
        can('manage', 'members')
      }
      else if (isSiteMember) {
        can('manage', 'siteassumptions')
        can('update', 'tenant')
        can('manage', 'users')
        can('read', 'members')
      }
    })
}