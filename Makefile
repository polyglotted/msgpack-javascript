.PHONY: publish

publish:
	  cmd=$(filter-out $@,$(MAKECMDGOALS))
	  npm run build
	  ifndef cmd
	  	npm publish
	  else
	  	eval $cmd publish
	  endif
%:
		@:
