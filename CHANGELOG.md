# Changelog

## [0.3.0](https://github.com/euyuil/packetrove/compare/0.2.0...0.3.0) (2026-10-03)


### ⚠ BREAKING CHANGES

* unify public tool names across interfaces ([#80](https://github.com/euyuil/packetrove/issues/80))

### Features

* **cli:** add offline version queries ([#94](https://github.com/euyuil/packetrove/issues/94)) ([a46cfc6](https://github.com/euyuil/packetrove/commit/a46cfc63510e8d6d25937fafaaf8f340c06e801c))
* convert inclusive IP ranges to exact CIDRs ([#83](https://github.com/euyuil/packetrove/issues/83)) ([1861137](https://github.com/euyuil/packetrove/commit/18611379fb152a24e486a75e805428cccaf57ba2))
* **mcp:** add shared server identity metadata ([#99](https://github.com/euyuil/packetrove/issues/99)) ([1b1319c](https://github.com/euyuil/packetrove/commit/1b1319c93865a0b3e697f2bfa7f7e7b42d6ed90b))
* **mcp:** link successful results to tool pages ([#102](https://github.com/euyuil/packetrove/issues/102)) ([c3d746d](https://github.com/euyuil/packetrove/commit/c3d746d27bf8883e08d1429bb9e6d54ae2f4a943))
* **mcp:** prepare official Registry publication ([#103](https://github.com/euyuil/packetrove/issues/103)) ([1d71b33](https://github.com/euyuil/packetrove/commit/1d71b339587d65d703590370720e8c3c31449e24))


### Bug Fixes

* **cli:** reject directory standard input ([#85](https://github.com/euyuil/packetrove/issues/85)) ([562d888](https://github.com/euyuil/packetrove/commit/562d88801d358d51336f766f3cb93e125411a668))
* **ip:** bound public IP responses with shared body reader ([#84](https://github.com/euyuil/packetrove/issues/84)) ([c4d8938](https://github.com/euyuil/packetrove/commit/c4d89387d3d2be191f8f21bc50ad71af10d2804b))
* **web:** align MCP navigation capitalization ([#90](https://github.com/euyuil/packetrove/issues/90)) ([21f9705](https://github.com/euyuil/packetrove/commit/21f9705e2a17f4e9d9011f3ab6ff2f68078135a4))
* **web:** identify invalid entries within each input line ([#71](https://github.com/euyuil/packetrove/issues/71)) ([38fecb3](https://github.com/euyuil/packetrove/commit/38fecb3c5e35ef70fea5ebf3eb6cf8b99c9f651b))
* **web:** improve carousel controls, indicators, and spacing ([#82](https://github.com/euyuil/packetrove/issues/82)) ([8b97060](https://github.com/euyuil/packetrove/commit/8b9706023de85f089f1458b05cb64a38ed3dad13))
* **web:** improve tool page presentation and interactions ([#75](https://github.com/euyuil/packetrove/issues/75)) ([d5d26f3](https://github.com/euyuil/packetrove/commit/d5d26f30b9045afb34bfcd829aa18487e51b67cd))
* **web:** place gallery buttons below tool descriptions ([#91](https://github.com/euyuil/packetrove/issues/91)) ([684c3b5](https://github.com/euyuil/packetrove/commit/684c3b575b0148902da232dc78c1247f50ac86aa))
* **web:** remove tool page category label ([#101](https://github.com/euyuil/packetrove/issues/101)) ([2a69099](https://github.com/euyuil/packetrove/commit/2a690999f236926fdcda2c48029be4b84fd36287))
* **web:** resolve TypeScript workspace imports during development ([#89](https://github.com/euyuil/packetrove/issues/89)) ([29ce224](https://github.com/euyuil/packetrove/commit/29ce22433ae4cc6a3a9e0fa785385f8a8d2f442f))
* **web:** restore floating browser language suggestion ([#81](https://github.com/euyuil/packetrove/issues/81)) ([8df29da](https://github.com/euyuil/packetrove/commit/8df29da56f4aaf78ede85e396c420498dd101c7c))
* **web:** scope gallery shortcuts and preserve visible focus ([#97](https://github.com/euyuil/packetrove/issues/97)) ([d98554e](https://github.com/euyuil/packetrove/commit/d98554ec82d4fe9e7609b62758e193b379cd0664))
* **web:** simplify and align GitHub footer link ([#87](https://github.com/euyuil/packetrove/issues/87)) ([4ee7930](https://github.com/euyuil/packetrove/commit/4ee7930b4ce627a44e958114d326df93913f318e))
* **web:** standardize footer link icons ([#98](https://github.com/euyuil/packetrove/issues/98)) ([b4b5585](https://github.com/euyuil/packetrove/commit/b4b5585a9b6ded9079835990946ecad3d745d743))
* **web:** standardize tool icon and title layouts ([#88](https://github.com/euyuil/packetrove/issues/88)) ([76ad5de](https://github.com/euyuil/packetrove/commit/76ad5ded1e63769d89bbc27d8c01a32c9935a0f4))
* **web:** use stable product and interface metadata ([#92](https://github.com/euyuil/packetrove/issues/92)) ([72d9afe](https://github.com/euyuil/packetrove/commit/72d9afe3b89c4c707dac98c698078ee662e484ec))


### Code Refactoring

* unify public tool names across interfaces ([#80](https://github.com/euyuil/packetrove/issues/80)) ([1f2b325](https://github.com/euyuil/packetrove/commit/1f2b3253c58c049d5999d7b561a7504da87af560))

## [0.2.0](https://github.com/euyuil/packetrove/compare/0.1.0...0.2.0) (2026-10-02)


### Features

* unify tool catalog and complete API and MCP coverage ([#59](https://github.com/euyuil/packetrove/issues/59)) ([547b541](https://github.com/euyuil/packetrove/commit/547b54141271cc0832cd7390d129e439d6d082a7))
* **web:** accept common separators in CIDR input lists ([#58](https://github.com/euyuil/packetrove/issues/58)) ([a2b0e7e](https://github.com/euyuil/packetrove/commit/a2b0e7e93fbb9eedd1a1d4a4ba571fffd8342f13))
* **web:** add a GitHub icon to the project footer ([#65](https://github.com/euyuil/packetrove/issues/65)) ([ab6ba6f](https://github.com/euyuil/packetrove/commit/ab6ba6f4e87246ca4d5eec57e911fc13ff7df5c0))
* **web:** add a home navigation icon ([#56](https://github.com/euyuil/packetrove/issues/56)) ([a4c4f0b](https://github.com/euyuil/packetrove/commit/a4c4f0bce9e98c34d7ebb332afd0af7f2cfb941e))
* **web:** add API documentation to the shared footer ([#61](https://github.com/euyuil/packetrove/issues/61)) ([00af303](https://github.com/euyuil/packetrove/commit/00af303c7c6d03239aaba5216009dcb2831640ac))
* **web:** add icons to existing tools ([#54](https://github.com/euyuil/packetrove/issues/54)) ([425c116](https://github.com/euyuil/packetrove/commit/425c116be5761e4c3b25311da1d6f928f9b99762))
* **web:** complete shared MCP integration guide ([#66](https://github.com/euyuil/packetrove/issues/66)) ([e516522](https://github.com/euyuil/packetrove/commit/e5165222e6827bed0510d87ee94db4eb2536ba09))
* **web:** improve tool previews with Mantine Carousel ([#72](https://github.com/euyuil/packetrove/issues/72)) ([885e5e2](https://github.com/euyuil/packetrove/commit/885e5e2f40040e9df64c268245bba5c27482ed66))
* **web:** present catalog examples in a homepage gallery ([#63](https://github.com/euyuil/packetrove/issues/63)) ([2a7b1c6](https://github.com/euyuil/packetrove/commit/2a7b1c6887605ea42ba842621fc64f487e6819f5))
* **web:** suggest the browser's preferred language ([#67](https://github.com/euyuil/packetrove/issues/67)) ([9dbd1a1](https://github.com/euyuil/packetrove/commit/9dbd1a16bd2b451a887b73bf4bc37018ec7034ab))


### Bug Fixes

* **cli:** bound standard-input line buffering ([#55](https://github.com/euyuil/packetrove/issues/55)) ([44293cd](https://github.com/euyuil/packetrove/commit/44293cdb6cd4c070d2961c4d7d9fd3ff90b5c8dc))
* regenerate MCP guide in release pull requests ([#69](https://github.com/euyuil/packetrove/issues/69)) ([4992334](https://github.com/euyuil/packetrove/commit/49923341505bdec0e2938113bafc2baaff39a953))
* **web:** add CIDR subtraction completion status ([#68](https://github.com/euyuil/packetrove/issues/68)) ([2fec547](https://github.com/euyuil/packetrove/commit/2fec54762582a25b4dd65af09cce240be65a031f))
* **web:** describe CIDR copy formats by separator ([#53](https://github.com/euyuil/packetrove/issues/53)) ([67fab03](https://github.com/euyuil/packetrove/commit/67fab03ff3e37176605cdc86a2e9b4a384a8b722))
* **web:** order Chinese, Japanese, and Korean language options ([#57](https://github.com/euyuil/packetrove/issues/57)) ([887c559](https://github.com/euyuil/packetrove/commit/887c5591aac7b963992f082dcf1039984355814b))
* **web:** order the language selector consistently ([#51](https://github.com/euyuil/packetrove/issues/51)) ([e2438c8](https://github.com/euyuil/packetrove/commit/e2438c86fc4f801167e408591417ea2c3f267991))
* **web:** remove focus outline around main content ([#52](https://github.com/euyuil/packetrove/issues/52)) ([5e87a45](https://github.com/euyuil/packetrove/commit/5e87a45169245aef3c13954542a59add678f70a3))
* **web:** simplify carousel navigation ([#73](https://github.com/euyuil/packetrove/issues/73)) ([465c6f6](https://github.com/euyuil/packetrove/commit/465c6f683346fde89871990b337be2517134f672))

## Changelog

Release-please adds Packetrove product version entries here.
