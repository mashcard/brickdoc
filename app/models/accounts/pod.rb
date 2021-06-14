# frozen_string_literal: true
class Accounts::Pod < ApplicationRecord
  validates :webid, presence: true, webid: true, uniqueness: { case_sensitive: false }
  validates :name, presence: true

  def avatar
    avatar_key
  end

  def self.webid_available?(webid)
    instance = new
    instance.webid = webid
    instance.valid?
    instance.errors[:webid].blank?
  end
end
