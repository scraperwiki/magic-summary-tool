#!/usr/bin/python

import nltk.corpus
import json

words_dict = {}
for word in nltk.corpus.stopwords.words():
  words_dict[word] = 1

print json.dumps(words_dict)


