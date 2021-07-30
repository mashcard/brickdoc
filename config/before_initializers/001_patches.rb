# frozen_string_literal: true

# Ruby Stdlib & Rails Monkey patch
Rails.application.reloader.to_prepare do
  Hash.prepend Patches::Hash
  String.prepend Patches::String

  ActiveRecord::Tasks::PostgreSQLDatabaseTasks.prepend Patches::ActiveRecord::PostgresqlDropDatabase
  ActionDispatch::Routing::Mapper.prepend Patches::ActionDispatch::DrawRoute

  ActiveStorage::Blob.class_eval do
    def real_url
      Brickdoc::Storage.real_url(self)
    end
  end
end
