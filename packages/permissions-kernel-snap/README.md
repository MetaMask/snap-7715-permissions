# @metamask/permissions-kernel-snap

This Snap manages a `permissions offer registry`, which lists all the permissions a user is willing to grant via a [ERC-7715](https://eip.tools/eip/7715) permissions request. When a dApp makes a 7715 request to the kernel, the kernel forwards it to a permissions provider Snap for user review and attenuation. If the dApp requests any permission not listed in the registry, the kernel automatically rejects the request.
