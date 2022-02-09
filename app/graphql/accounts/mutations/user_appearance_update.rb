# frozen_string_literal: true
module Accounts
  class Mutations::UserAppearanceUpdate < BrickGraphQL::BaseMutation
    argument :locale, String, description_same(Objects::User, :locale), required: false
    argument :timezone, String, description_same(Objects::User, :timezone), required: false

    def resolve(locale:, timezone:)
      current_user.locale = locale if locale.present?
      current_user.timezone = timezone if timezone.present?
      success = current_user.save
      return { errors: pod.errors.full_messages } unless success
      {}
    end
  end
end
