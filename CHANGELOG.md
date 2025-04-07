### Changelog

#### 1.4.0 - 2025-04-07
- **Code Refactoring**: Remove docker depenency and use Node.js directly.
  - **File**: Dockerfile
  - **Details**: Changed to browsertime image  sitespeedio/browsertime:24.5.2 and added nodejs lts 20
  - **File**: src/browsertime.js
  - **Details**: added functionality to start a new unique browser for each url in the config file so that browser state is not shared between urls.
  - **File**: docker-entrypoint.sh
  - **Details**: updated the entrypoint script to handle the new functionality in browsertime.js.