/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

const { assert } = require("console");
const OperationBase = require("./utils/operation-base");

/**
 * Workload module for initializing the SUT with various accounts.
 */
class Open extends OperationBase {
  /**
   * Initializes the parameters of the workload.
   */
  constructor() {
    super();
  }

  /**
   * Assemble TXs for opening new accounts.
   */
  async submitTransaction() {
    await this.sutAdapter.sendRequests(
      this.createConnectorRequest("evaluateAllBmcRating", [])
    );
  }
}

/**
 * Create a new instance of the workload module.
 * @return {WorkloadModuleInterface}
 */
function createWorkloadModule() {
  return new Open();
}

module.exports.createWorkloadModule = createWorkloadModule;
