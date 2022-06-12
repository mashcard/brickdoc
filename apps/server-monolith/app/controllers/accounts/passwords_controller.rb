# frozen_string_literal: true

module Accounts
  class PasswordsController < ::Devise::PasswordsController
    # GET /resource/password/new
    def new
      render 'pages/pwa'
    end

    # POST /resource/password
    def create
      # Only Support GraphQL API
      raise ActionController::RoutingError, 'Not Found'
    end

    def edit
      render 'pages/pwa'
    end

    def update
      # Only Support GraphQL API
      raise ActionController::RoutingError, 'Not Found'
    end
  end
end
