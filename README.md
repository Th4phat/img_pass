# Password Image Manager

A liltle project made by me to store your password locally in an image file by using exiftool to write and read metadata in an image

Todo piority [high>low]
- generate secure password
- encrypted password before storing
- better ui/ux
- don't need to install exiftool


## Usage

First go and install [exiftool](https://exiftool.org/) on your system or follow [this tutorial](https://www.youtube.com/watch?v=IVz_S2qgKkg) and then download and run program in the release binary

you can build this yourself by installing [rust](https://www.rust-lang.org/) and [bun](https://bun.sh/) and follow these step
```sh
git clone https://github.com/Th4phat/img_pass.git
cd img_pass
bun install
bun tauri build
```
The binary will be in `src-tauri/target/release`


## :D
Feel free to contribute to this silly project
- [@Me](https://github.com/Th4phat)

