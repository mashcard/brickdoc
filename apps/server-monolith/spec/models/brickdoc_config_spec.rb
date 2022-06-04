# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BrickdocConfig, type: :model do
  before do
    Rails.cache.clear
  end

  it 'can be read' do
    expect(described_class.accounts_email_password_auth?).to be(true)
  end

  it 'can handle settings on different context' do
    described_class.field :domains_test, default: 'test', belongs_to: :space
    described_class.namespace(:testing).field :domains_test2, default: 'foo', belongs_to: :space

    # namespace should work
    expect(described_class.domains_test).to eq('test')
    expect { described_class.domains_test2 }.to raise_error(NoMethodError)
    expect { described_class.domains_test2 = 1 }.to raise_error(Brickdoc::Settings::Errors::NotFoundField)

    expect(described_class.namespace(:testing).get(:domains_test)).to be_nil
    expect(described_class.namespace(:testing).domains_test2).to eq('foo')

    space1_settings = described_class.at(space_id: 1)
    space2_settings = described_class.at(space_id: 2)

    space2_settings.domains_test = 'test2'
    described_class.namespace(:testing).at(space_id: 2).domains_test2 = 'test2'

    expect(space1_settings.domains_test).to eq('test')
    expect(space1_settings.namespace(:testing).domains_test2).to eq('foo')

    expect(space2_settings.domains_test).to eq('test2')
    expect(space2_settings.namespace(:testing).domains_test2).to eq('test2')
  end

  it 'can get and set current' do
    described_class.field :current_key, default: 'current', belongs_to: :user
    described_class.at(user_id: 1).current_key = 'user1'

    expect(described_class.at(user_id: nil).current_key).to eq('current')

    described_class.current = described_class.at(user_id: 1)
    expect(described_class.current.current_key).to eq('user1')
  end

  it 'uses set_global to override global settings' do
    described_class.field :global_test, default: 'foo'
    expect { described_class.global_test = '123' }.to raise_error(ArgumentError)
    described_class.set(:global_test, '456', allow_global: true)
    expect(described_class.global_test).to eq('456')
  end

  it 'scope fallback should work' do
    described_class.namespace(:testing) do
      field :global, default: 'foo'
      field :space, default: 'bar', belongs_to: :space
      field :user, default: 'baz', belongs_to: :user

      at(space_id: 1, user_id: 9).set_all_users_in_space(:space, 'space1')
      at(space_id: 1, user_id: 1).set(:space, 'space1-1')
      at(space_id: 1, user_id: 2).set(:space, 'space1-2')
      at(space_id: 2, user_id: 2).set(:space, 'space2-2')

      at(user_id: 1, space_id: 6666).set_all_spaces_in_user(:user, 'user1')
      at(user_id: 1, space_id: 1).set(:user, 'user1-1')
      at(user_id: 1, space_id: 2).set(:user, 'user1-2')
      at(user_id: 2, space_id: 2).set(:user, 'user2-2')
    end
    testing = described_class.namespace(:testing)
    # global
    expect { testing.at(space_id: 2).global = 'eee' }.to raise_error(ArgumentError)
    testing.at(user_id: 9).set_global(:global, 'gogogo')
    expect(testing.global).to eq('gogogo')
    expect(testing.at(space_id: 8, user_id: 7).global).to eq('gogogo')

    # space scope
    expect(testing.get(:space)).to eq('bar')
    expect(testing.at(space_id: 1).space).to eq('space1')
    expect(testing.at(space_id: 1, user_id: 1).space).to eq('space1-1')
    expect(testing.at(space_id: 1, user_id: 2).space).to eq('space1-2')
    expect(testing.at(space_id: 2, user_id: 2).space).to eq('space2-2')
    expect(testing.at(user_id: 1).space).to eq('bar')

    # user scope
    expect(testing.get(:user)).to eq('baz')
    expect(testing.at(user_id: 1).user).to eq('user1')
    expect(testing.at(user_id: 1, space_id: 1).user).to eq('user1-1')
    expect(testing.at(user_id: 1, space_id: 2).user).to eq('user1-2')
    expect(testing.at(user_id: 2, space_id: 2).user).to eq('user2-2')
    expect(testing.at(space_id: 1).user).to eq('baz')
  end

  it 'field type should work' do
    described_class.namespace(:type_test) do
      field :secret, type: :encrypted
      field :int, type: :integer
      field :bool, type: :boolean

      field :ro_val, default: 'x', read_only: true

      field :array_val, type: :array
      field :hash_val, type: :hash
      field :hash_val2, type: :hash, symbolize_keys: true
    end
    type_test = described_class.namespace(:type_test)
    expect(type_test.get(:int)).to be_nil
    type_test.set(:int, 123, allow_global: true)
    expect(type_test.get(:int)).to eq(123)

    expect(type_test.get('bool')).to be_nil
    expect(type_test).not_to be_bool
    type_test.set('bool', true, allow_global: true)
    expect(type_test.get('bool')).to be_truthy
    expect(type_test).to be_bool
    type_test.set('bool', false, allow_global: true)
    expect(type_test.get('bool')).to be_falsey
    expect(type_test).not_to be_bool

    expect(type_test.get(:ro_val)).to eq('x')
    expect { type_test.set(:ro_val, 'y', allow_global: true) }.to raise_error(Brickdoc::Settings::Errors::ReadOnlyField)

    type_test.set(:array_val, [1, 2, 3], allow_global: true)
    expect(type_test.get(:array_val)).to eq([1, 2, 3])

    type_test.set(:hash_val, { a: 1, b: 2 }, allow_global: true)
    expect(type_test.get(:hash_val)).to eq({ a: 1, b: 2 })

    expect(type_test).to respond_to(:int)
    expect(type_test).to respond_to(:secret)
    expect(type_test).not_to respond_to(:noting)

    type_test.set(:secret, 'hihi', allow_global: true)
    expect(type_test.get(:secret)).to eq('hihi')
    expect(described_class.find_by(scope: 'R', key: 'type_test.secret')).not_to eq('hihi')
  end
end
