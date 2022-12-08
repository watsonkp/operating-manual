FROM ruby:2.7

WORKDIR /usr/src/app

RUN bundle config --global frozen 1
COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY public ./public

COPY api.rb .

EXPOSE 4567/tcp

CMD ["./api.rb"]
