.PHONY: publish

cmd = $(filter-out $@,$(MAKECMDGOALS))

ifeq ($(cmd), $(null))
	cmd = npm
endif

cmd += publish

publish:
	  eval $(cmd)
	  
%:
		@:
