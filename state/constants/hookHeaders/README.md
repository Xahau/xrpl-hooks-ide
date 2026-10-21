# Default Hook header files

`public/headers/*.h` are verbatim copies of `hook/*.h` from the xahaud repository
(https://github.com/Xahau/xahaud, branch `dev`, commit 22e6ad21b4).

They are the fallback used by "Update header files" when the connected
network's `server_definitions` does not expose a section (for example the
`HOOK` section introduced by Xahau/xahaud#884), and for the headers that
are not generated at all (`macro.h`, `ls_flags.h`, `tx_flags.h`).

Update them by hand whenever a new xahaud release ships:

```sh
cp path/to/xahaud/hook/*.h public/headers/
```

and bump the commit reference above.
