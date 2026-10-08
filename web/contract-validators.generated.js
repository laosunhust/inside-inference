// Generated with Ajv and esbuild; DO NOT EDIT.
"use strict";
var CompiledContracts = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // contract-validators.cjs
  var require_contract_validators = __commonJS({
    "contract-validators.cjs"(exports) {
      exports.ModelArchitecture = validate21;
      var schema32 = { "type": "object", "x-owner": "ModelArtifact", "additionalProperties": false, "required": ["vocabulary", "width", "ffn", "context", "layers", "heads", "epsilon", "position", "normalization", "activation", "precision"], "properties": { "vocabulary": { "type": "integer", "title": "Vocabulary IDs", "description": "Supported baseline value.", "const": 384, "default": 384 }, "width": { "type": "integer", "title": "Hidden width", "description": "Channels per position.", "default": 8, "minimum": 2, "maximum": 32 }, "ffn": { "type": "integer", "title": "Feed-forward width", "description": "Intermediate channels.", "default": 16, "minimum": 2, "maximum": 128 }, "context": { "type": "integer", "title": "Context capacity", "description": "Maximum input positions in a forward pass.", "default": 128, "minimum": 1, "maximum": 128 }, "layers": { "type": "integer", "title": "Blocks", "description": "Supported baseline value.", "const": 1, "default": 1 }, "heads": { "type": "integer", "title": "Attention heads", "description": "Supported baseline value.", "const": 1, "default": 1 }, "epsilon": { "type": "number", "title": "Normalization epsilon", "description": "Supported baseline value.", "const": 1e-5, "default": 1e-5 }, "position": { "type": "string", "title": "Position encoding", "description": "Supported baseline value.", "const": "learned-absolute", "default": "learned-absolute" }, "normalization": { "type": "string", "title": "Normalization order", "description": "Supported baseline value.", "const": "pre-layernorm", "default": "pre-layernorm" }, "activation": { "type": "string", "title": "Activation", "description": "Supported baseline value.", "const": "gelu-tanh", "default": "gelu-tanh" }, "precision": { "type": "string", "title": "Storage / compute / accumulation", "description": "Supported baseline value.", "const": "binary64", "default": "binary64" } } };
      var func1 = Object.prototype.hasOwnProperty;
      function validate21(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate21.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.vocabulary === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "vocabulary" }, message: "must have required property 'vocabulary'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.width === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "width" }, message: "must have required property 'width'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.ffn === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "ffn" }, message: "must have required property 'ffn'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          if (data.context === void 0) {
            const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "context" }, message: "must have required property 'context'" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
          if (data.layers === void 0) {
            const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "layers" }, message: "must have required property 'layers'" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
          if (data.heads === void 0) {
            const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "heads" }, message: "must have required property 'heads'" };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
          if (data.epsilon === void 0) {
            const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "epsilon" }, message: "must have required property 'epsilon'" };
            if (vErrors === null) {
              vErrors = [err6];
            } else {
              vErrors.push(err6);
            }
            errors++;
          }
          if (data.position === void 0) {
            const err7 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "position" }, message: "must have required property 'position'" };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
          if (data.normalization === void 0) {
            const err8 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "normalization" }, message: "must have required property 'normalization'" };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
          if (data.activation === void 0) {
            const err9 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "activation" }, message: "must have required property 'activation'" };
            if (vErrors === null) {
              vErrors = [err9];
            } else {
              vErrors.push(err9);
            }
            errors++;
          }
          if (data.precision === void 0) {
            const err10 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "precision" }, message: "must have required property 'precision'" };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!func1.call(schema32.properties, key0)) {
              const err11 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
          }
          if (data.vocabulary !== void 0) {
            let data0 = data.vocabulary;
            if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)) && isFinite(data0))) {
              const err12 = { instancePath: instancePath + "/vocabulary", schemaPath: "#/properties/vocabulary/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
            if (384 !== data0) {
              const err13 = { instancePath: instancePath + "/vocabulary", schemaPath: "#/properties/vocabulary/const", keyword: "const", params: { allowedValue: 384 }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
          }
          if (data.width !== void 0) {
            let data1 = data.width;
            if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
              const err14 = { instancePath: instancePath + "/width", schemaPath: "#/properties/width/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (typeof data1 == "number" && isFinite(data1)) {
              if (data1 > 32 || isNaN(data1)) {
                const err15 = { instancePath: instancePath + "/width", schemaPath: "#/properties/width/maximum", keyword: "maximum", params: { comparison: "<=", limit: 32 }, message: "must be <= 32" };
                if (vErrors === null) {
                  vErrors = [err15];
                } else {
                  vErrors.push(err15);
                }
                errors++;
              }
              if (data1 < 2 || isNaN(data1)) {
                const err16 = { instancePath: instancePath + "/width", schemaPath: "#/properties/width/minimum", keyword: "minimum", params: { comparison: ">=", limit: 2 }, message: "must be >= 2" };
                if (vErrors === null) {
                  vErrors = [err16];
                } else {
                  vErrors.push(err16);
                }
                errors++;
              }
            }
          }
          if (data.ffn !== void 0) {
            let data2 = data.ffn;
            if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
              const err17 = { instancePath: instancePath + "/ffn", schemaPath: "#/properties/ffn/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (typeof data2 == "number" && isFinite(data2)) {
              if (data2 > 128 || isNaN(data2)) {
                const err18 = { instancePath: instancePath + "/ffn", schemaPath: "#/properties/ffn/maximum", keyword: "maximum", params: { comparison: "<=", limit: 128 }, message: "must be <= 128" };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
              if (data2 < 2 || isNaN(data2)) {
                const err19 = { instancePath: instancePath + "/ffn", schemaPath: "#/properties/ffn/minimum", keyword: "minimum", params: { comparison: ">=", limit: 2 }, message: "must be >= 2" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
            }
          }
          if (data.context !== void 0) {
            let data3 = data.context;
            if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
              const err20 = { instancePath: instancePath + "/context", schemaPath: "#/properties/context/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (typeof data3 == "number" && isFinite(data3)) {
              if (data3 > 128 || isNaN(data3)) {
                const err21 = { instancePath: instancePath + "/context", schemaPath: "#/properties/context/maximum", keyword: "maximum", params: { comparison: "<=", limit: 128 }, message: "must be <= 128" };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
              if (data3 < 1 || isNaN(data3)) {
                const err22 = { instancePath: instancePath + "/context", schemaPath: "#/properties/context/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
            }
          }
          if (data.layers !== void 0) {
            let data4 = data.layers;
            if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
              const err23 = { instancePath: instancePath + "/layers", schemaPath: "#/properties/layers/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err23];
              } else {
                vErrors.push(err23);
              }
              errors++;
            }
            if (1 !== data4) {
              const err24 = { instancePath: instancePath + "/layers", schemaPath: "#/properties/layers/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err24];
              } else {
                vErrors.push(err24);
              }
              errors++;
            }
          }
          if (data.heads !== void 0) {
            let data5 = data.heads;
            if (!(typeof data5 == "number" && (!(data5 % 1) && !isNaN(data5)) && isFinite(data5))) {
              const err25 = { instancePath: instancePath + "/heads", schemaPath: "#/properties/heads/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err25];
              } else {
                vErrors.push(err25);
              }
              errors++;
            }
            if (1 !== data5) {
              const err26 = { instancePath: instancePath + "/heads", schemaPath: "#/properties/heads/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err26];
              } else {
                vErrors.push(err26);
              }
              errors++;
            }
          }
          if (data.epsilon !== void 0) {
            let data6 = data.epsilon;
            if (!(typeof data6 == "number" && isFinite(data6))) {
              const err27 = { instancePath: instancePath + "/epsilon", schemaPath: "#/properties/epsilon/type", keyword: "type", params: { type: "number" }, message: "must be number" };
              if (vErrors === null) {
                vErrors = [err27];
              } else {
                vErrors.push(err27);
              }
              errors++;
            }
            if (1e-5 !== data6) {
              const err28 = { instancePath: instancePath + "/epsilon", schemaPath: "#/properties/epsilon/const", keyword: "const", params: { allowedValue: 1e-5 }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err28];
              } else {
                vErrors.push(err28);
              }
              errors++;
            }
          }
          if (data.position !== void 0) {
            let data7 = data.position;
            if (typeof data7 !== "string") {
              const err29 = { instancePath: instancePath + "/position", schemaPath: "#/properties/position/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err29];
              } else {
                vErrors.push(err29);
              }
              errors++;
            }
            if ("learned-absolute" !== data7) {
              const err30 = { instancePath: instancePath + "/position", schemaPath: "#/properties/position/const", keyword: "const", params: { allowedValue: "learned-absolute" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err30];
              } else {
                vErrors.push(err30);
              }
              errors++;
            }
          }
          if (data.normalization !== void 0) {
            let data8 = data.normalization;
            if (typeof data8 !== "string") {
              const err31 = { instancePath: instancePath + "/normalization", schemaPath: "#/properties/normalization/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err31];
              } else {
                vErrors.push(err31);
              }
              errors++;
            }
            if ("pre-layernorm" !== data8) {
              const err32 = { instancePath: instancePath + "/normalization", schemaPath: "#/properties/normalization/const", keyword: "const", params: { allowedValue: "pre-layernorm" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err32];
              } else {
                vErrors.push(err32);
              }
              errors++;
            }
          }
          if (data.activation !== void 0) {
            let data9 = data.activation;
            if (typeof data9 !== "string") {
              const err33 = { instancePath: instancePath + "/activation", schemaPath: "#/properties/activation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err33];
              } else {
                vErrors.push(err33);
              }
              errors++;
            }
            if ("gelu-tanh" !== data9) {
              const err34 = { instancePath: instancePath + "/activation", schemaPath: "#/properties/activation/const", keyword: "const", params: { allowedValue: "gelu-tanh" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err34];
              } else {
                vErrors.push(err34);
              }
              errors++;
            }
          }
          if (data.precision !== void 0) {
            let data10 = data.precision;
            if (typeof data10 !== "string") {
              const err35 = { instancePath: instancePath + "/precision", schemaPath: "#/properties/precision/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err35];
              } else {
                vErrors.push(err35);
              }
              errors++;
            }
            if ("binary64" !== data10) {
              const err36 = { instancePath: instancePath + "/precision", schemaPath: "#/properties/precision/const", keyword: "const", params: { allowedValue: "binary64" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err36];
              } else {
                vErrors.push(err36);
              }
              errors++;
            }
          }
        } else {
          const err37 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err37];
          } else {
            vErrors.push(err37);
          }
          errors++;
        }
        validate21.errors = vErrors;
        return errors === 0;
      }
      validate21.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.ModelArtifact = validate22;
      var pattern4 = new RegExp("^[0-9a-f]{64}$", "u");
      function validate22(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate22.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.checkpoint_sha256 === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "checkpoint_sha256" }, message: "must have required property 'checkpoint_sha256'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.tokenizer_sha256 === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "tokenizer_sha256" }, message: "must have required property 'tokenizer_sha256'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.architecture === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "architecture" }, message: "must have required property 'architecture'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "checkpoint_sha256" || key0 === "tokenizer_sha256" || key0 === "architecture")) {
              const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
          }
          if (data.checkpoint_sha256 !== void 0) {
            let data0 = data.checkpoint_sha256;
            if (typeof data0 === "string") {
              if (!pattern4.test(data0)) {
                const err4 = { instancePath: instancePath + "/checkpoint_sha256", schemaPath: "#/properties/checkpoint_sha256/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{64}$" }, message: 'must match pattern "^[0-9a-f]{64}$"' };
                if (vErrors === null) {
                  vErrors = [err4];
                } else {
                  vErrors.push(err4);
                }
                errors++;
              }
            } else {
              const err5 = { instancePath: instancePath + "/checkpoint_sha256", schemaPath: "#/properties/checkpoint_sha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
          }
          if (data.tokenizer_sha256 !== void 0) {
            let data1 = data.tokenizer_sha256;
            if (typeof data1 === "string") {
              if (!pattern4.test(data1)) {
                const err6 = { instancePath: instancePath + "/tokenizer_sha256", schemaPath: "#/properties/tokenizer_sha256/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{64}$" }, message: 'must match pattern "^[0-9a-f]{64}$"' };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
            } else {
              const err7 = { instancePath: instancePath + "/tokenizer_sha256", schemaPath: "#/properties/tokenizer_sha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
          if (data.architecture !== void 0) {
            let data2 = data.architecture;
            if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
              if (data2.vocabulary === void 0) {
                const err8 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "vocabulary" }, message: "must have required property 'vocabulary'" };
                if (vErrors === null) {
                  vErrors = [err8];
                } else {
                  vErrors.push(err8);
                }
                errors++;
              }
              if (data2.width === void 0) {
                const err9 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "width" }, message: "must have required property 'width'" };
                if (vErrors === null) {
                  vErrors = [err9];
                } else {
                  vErrors.push(err9);
                }
                errors++;
              }
              if (data2.ffn === void 0) {
                const err10 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "ffn" }, message: "must have required property 'ffn'" };
                if (vErrors === null) {
                  vErrors = [err10];
                } else {
                  vErrors.push(err10);
                }
                errors++;
              }
              if (data2.context === void 0) {
                const err11 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "context" }, message: "must have required property 'context'" };
                if (vErrors === null) {
                  vErrors = [err11];
                } else {
                  vErrors.push(err11);
                }
                errors++;
              }
              if (data2.layers === void 0) {
                const err12 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "layers" }, message: "must have required property 'layers'" };
                if (vErrors === null) {
                  vErrors = [err12];
                } else {
                  vErrors.push(err12);
                }
                errors++;
              }
              if (data2.heads === void 0) {
                const err13 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "heads" }, message: "must have required property 'heads'" };
                if (vErrors === null) {
                  vErrors = [err13];
                } else {
                  vErrors.push(err13);
                }
                errors++;
              }
              if (data2.epsilon === void 0) {
                const err14 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "epsilon" }, message: "must have required property 'epsilon'" };
                if (vErrors === null) {
                  vErrors = [err14];
                } else {
                  vErrors.push(err14);
                }
                errors++;
              }
              if (data2.position === void 0) {
                const err15 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "position" }, message: "must have required property 'position'" };
                if (vErrors === null) {
                  vErrors = [err15];
                } else {
                  vErrors.push(err15);
                }
                errors++;
              }
              if (data2.normalization === void 0) {
                const err16 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "normalization" }, message: "must have required property 'normalization'" };
                if (vErrors === null) {
                  vErrors = [err16];
                } else {
                  vErrors.push(err16);
                }
                errors++;
              }
              if (data2.activation === void 0) {
                const err17 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "activation" }, message: "must have required property 'activation'" };
                if (vErrors === null) {
                  vErrors = [err17];
                } else {
                  vErrors.push(err17);
                }
                errors++;
              }
              if (data2.precision === void 0) {
                const err18 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "precision" }, message: "must have required property 'precision'" };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
              for (const key1 in data2) {
                if (!func1.call(schema32.properties, key1)) {
                  const err19 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err19];
                  } else {
                    vErrors.push(err19);
                  }
                  errors++;
                }
              }
              if (data2.vocabulary !== void 0) {
                let data3 = data2.vocabulary;
                if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                  const err20 = { instancePath: instancePath + "/architecture/vocabulary", schemaPath: "#/$defs/ModelArchitecture/properties/vocabulary/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err20];
                  } else {
                    vErrors.push(err20);
                  }
                  errors++;
                }
                if (384 !== data3) {
                  const err21 = { instancePath: instancePath + "/architecture/vocabulary", schemaPath: "#/$defs/ModelArchitecture/properties/vocabulary/const", keyword: "const", params: { allowedValue: 384 }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err21];
                  } else {
                    vErrors.push(err21);
                  }
                  errors++;
                }
              }
              if (data2.width !== void 0) {
                let data4 = data2.width;
                if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
                  const err22 = { instancePath: instancePath + "/architecture/width", schemaPath: "#/$defs/ModelArchitecture/properties/width/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err22];
                  } else {
                    vErrors.push(err22);
                  }
                  errors++;
                }
                if (typeof data4 == "number" && isFinite(data4)) {
                  if (data4 > 32 || isNaN(data4)) {
                    const err23 = { instancePath: instancePath + "/architecture/width", schemaPath: "#/$defs/ModelArchitecture/properties/width/maximum", keyword: "maximum", params: { comparison: "<=", limit: 32 }, message: "must be <= 32" };
                    if (vErrors === null) {
                      vErrors = [err23];
                    } else {
                      vErrors.push(err23);
                    }
                    errors++;
                  }
                  if (data4 < 2 || isNaN(data4)) {
                    const err24 = { instancePath: instancePath + "/architecture/width", schemaPath: "#/$defs/ModelArchitecture/properties/width/minimum", keyword: "minimum", params: { comparison: ">=", limit: 2 }, message: "must be >= 2" };
                    if (vErrors === null) {
                      vErrors = [err24];
                    } else {
                      vErrors.push(err24);
                    }
                    errors++;
                  }
                }
              }
              if (data2.ffn !== void 0) {
                let data5 = data2.ffn;
                if (!(typeof data5 == "number" && (!(data5 % 1) && !isNaN(data5)) && isFinite(data5))) {
                  const err25 = { instancePath: instancePath + "/architecture/ffn", schemaPath: "#/$defs/ModelArchitecture/properties/ffn/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err25];
                  } else {
                    vErrors.push(err25);
                  }
                  errors++;
                }
                if (typeof data5 == "number" && isFinite(data5)) {
                  if (data5 > 128 || isNaN(data5)) {
                    const err26 = { instancePath: instancePath + "/architecture/ffn", schemaPath: "#/$defs/ModelArchitecture/properties/ffn/maximum", keyword: "maximum", params: { comparison: "<=", limit: 128 }, message: "must be <= 128" };
                    if (vErrors === null) {
                      vErrors = [err26];
                    } else {
                      vErrors.push(err26);
                    }
                    errors++;
                  }
                  if (data5 < 2 || isNaN(data5)) {
                    const err27 = { instancePath: instancePath + "/architecture/ffn", schemaPath: "#/$defs/ModelArchitecture/properties/ffn/minimum", keyword: "minimum", params: { comparison: ">=", limit: 2 }, message: "must be >= 2" };
                    if (vErrors === null) {
                      vErrors = [err27];
                    } else {
                      vErrors.push(err27);
                    }
                    errors++;
                  }
                }
              }
              if (data2.context !== void 0) {
                let data6 = data2.context;
                if (!(typeof data6 == "number" && (!(data6 % 1) && !isNaN(data6)) && isFinite(data6))) {
                  const err28 = { instancePath: instancePath + "/architecture/context", schemaPath: "#/$defs/ModelArchitecture/properties/context/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err28];
                  } else {
                    vErrors.push(err28);
                  }
                  errors++;
                }
                if (typeof data6 == "number" && isFinite(data6)) {
                  if (data6 > 128 || isNaN(data6)) {
                    const err29 = { instancePath: instancePath + "/architecture/context", schemaPath: "#/$defs/ModelArchitecture/properties/context/maximum", keyword: "maximum", params: { comparison: "<=", limit: 128 }, message: "must be <= 128" };
                    if (vErrors === null) {
                      vErrors = [err29];
                    } else {
                      vErrors.push(err29);
                    }
                    errors++;
                  }
                  if (data6 < 1 || isNaN(data6)) {
                    const err30 = { instancePath: instancePath + "/architecture/context", schemaPath: "#/$defs/ModelArchitecture/properties/context/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                    if (vErrors === null) {
                      vErrors = [err30];
                    } else {
                      vErrors.push(err30);
                    }
                    errors++;
                  }
                }
              }
              if (data2.layers !== void 0) {
                let data7 = data2.layers;
                if (!(typeof data7 == "number" && (!(data7 % 1) && !isNaN(data7)) && isFinite(data7))) {
                  const err31 = { instancePath: instancePath + "/architecture/layers", schemaPath: "#/$defs/ModelArchitecture/properties/layers/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err31];
                  } else {
                    vErrors.push(err31);
                  }
                  errors++;
                }
                if (1 !== data7) {
                  const err32 = { instancePath: instancePath + "/architecture/layers", schemaPath: "#/$defs/ModelArchitecture/properties/layers/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err32];
                  } else {
                    vErrors.push(err32);
                  }
                  errors++;
                }
              }
              if (data2.heads !== void 0) {
                let data8 = data2.heads;
                if (!(typeof data8 == "number" && (!(data8 % 1) && !isNaN(data8)) && isFinite(data8))) {
                  const err33 = { instancePath: instancePath + "/architecture/heads", schemaPath: "#/$defs/ModelArchitecture/properties/heads/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err33];
                  } else {
                    vErrors.push(err33);
                  }
                  errors++;
                }
                if (1 !== data8) {
                  const err34 = { instancePath: instancePath + "/architecture/heads", schemaPath: "#/$defs/ModelArchitecture/properties/heads/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err34];
                  } else {
                    vErrors.push(err34);
                  }
                  errors++;
                }
              }
              if (data2.epsilon !== void 0) {
                let data9 = data2.epsilon;
                if (!(typeof data9 == "number" && isFinite(data9))) {
                  const err35 = { instancePath: instancePath + "/architecture/epsilon", schemaPath: "#/$defs/ModelArchitecture/properties/epsilon/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                  if (vErrors === null) {
                    vErrors = [err35];
                  } else {
                    vErrors.push(err35);
                  }
                  errors++;
                }
                if (1e-5 !== data9) {
                  const err36 = { instancePath: instancePath + "/architecture/epsilon", schemaPath: "#/$defs/ModelArchitecture/properties/epsilon/const", keyword: "const", params: { allowedValue: 1e-5 }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err36];
                  } else {
                    vErrors.push(err36);
                  }
                  errors++;
                }
              }
              if (data2.position !== void 0) {
                let data10 = data2.position;
                if (typeof data10 !== "string") {
                  const err37 = { instancePath: instancePath + "/architecture/position", schemaPath: "#/$defs/ModelArchitecture/properties/position/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err37];
                  } else {
                    vErrors.push(err37);
                  }
                  errors++;
                }
                if ("learned-absolute" !== data10) {
                  const err38 = { instancePath: instancePath + "/architecture/position", schemaPath: "#/$defs/ModelArchitecture/properties/position/const", keyword: "const", params: { allowedValue: "learned-absolute" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err38];
                  } else {
                    vErrors.push(err38);
                  }
                  errors++;
                }
              }
              if (data2.normalization !== void 0) {
                let data11 = data2.normalization;
                if (typeof data11 !== "string") {
                  const err39 = { instancePath: instancePath + "/architecture/normalization", schemaPath: "#/$defs/ModelArchitecture/properties/normalization/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err39];
                  } else {
                    vErrors.push(err39);
                  }
                  errors++;
                }
                if ("pre-layernorm" !== data11) {
                  const err40 = { instancePath: instancePath + "/architecture/normalization", schemaPath: "#/$defs/ModelArchitecture/properties/normalization/const", keyword: "const", params: { allowedValue: "pre-layernorm" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err40];
                  } else {
                    vErrors.push(err40);
                  }
                  errors++;
                }
              }
              if (data2.activation !== void 0) {
                let data12 = data2.activation;
                if (typeof data12 !== "string") {
                  const err41 = { instancePath: instancePath + "/architecture/activation", schemaPath: "#/$defs/ModelArchitecture/properties/activation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err41];
                  } else {
                    vErrors.push(err41);
                  }
                  errors++;
                }
                if ("gelu-tanh" !== data12) {
                  const err42 = { instancePath: instancePath + "/architecture/activation", schemaPath: "#/$defs/ModelArchitecture/properties/activation/const", keyword: "const", params: { allowedValue: "gelu-tanh" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err42];
                  } else {
                    vErrors.push(err42);
                  }
                  errors++;
                }
              }
              if (data2.precision !== void 0) {
                let data13 = data2.precision;
                if (typeof data13 !== "string") {
                  const err43 = { instancePath: instancePath + "/architecture/precision", schemaPath: "#/$defs/ModelArchitecture/properties/precision/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err43];
                  } else {
                    vErrors.push(err43);
                  }
                  errors++;
                }
                if ("binary64" !== data13) {
                  const err44 = { instancePath: instancePath + "/architecture/precision", schemaPath: "#/$defs/ModelArchitecture/properties/precision/const", keyword: "const", params: { allowedValue: "binary64" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err44];
                  } else {
                    vErrors.push(err44);
                  }
                  errors++;
                }
              }
            } else {
              const err45 = { instancePath: instancePath + "/architecture", schemaPath: "#/$defs/ModelArchitecture/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err45];
              } else {
                vErrors.push(err45);
              }
              errors++;
            }
          }
        } else {
          const err46 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err46];
          } else {
            vErrors.push(err46);
          }
          errors++;
        }
        validate22.errors = vErrors;
        return errors === 0;
      }
      validate22.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.InferenceSystem = validate23;
      function validate23(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate23.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.execution === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "execution" }, message: "must have required property 'execution'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.max_new_tokens_cap === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "max_new_tokens_cap" }, message: "must have required property 'max_new_tokens_cap'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.max_requests === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "max_requests" }, message: "must have required property 'max_requests'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          if (data.arrival_policy === void 0) {
            const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "arrival_policy" }, message: "must have required property 'arrival_policy'" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "execution" || key0 === "max_new_tokens_cap" || key0 === "max_requests" || key0 === "arrival_policy")) {
              const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
          }
          if (data.execution !== void 0) {
            let data0 = data.execution;
            if (typeof data0 !== "string") {
              const err5 = { instancePath: instancePath + "/execution", schemaPath: "#/properties/execution/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if ("full-prefix-recomputation" !== data0) {
              const err6 = { instancePath: instancePath + "/execution", schemaPath: "#/properties/execution/const", keyword: "const", params: { allowedValue: "full-prefix-recomputation" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
          }
          if (data.max_new_tokens_cap !== void 0) {
            let data1 = data.max_new_tokens_cap;
            if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
              const err7 = { instancePath: instancePath + "/max_new_tokens_cap", schemaPath: "#/properties/max_new_tokens_cap/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            if (8 !== data1) {
              const err8 = { instancePath: instancePath + "/max_new_tokens_cap", schemaPath: "#/properties/max_new_tokens_cap/const", keyword: "const", params: { allowedValue: 8 }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
          }
          if (data.max_requests !== void 0) {
            let data2 = data.max_requests;
            if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
              const err9 = { instancePath: instancePath + "/max_requests", schemaPath: "#/properties/max_requests/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            }
            if (1 !== data2) {
              const err10 = { instancePath: instancePath + "/max_requests", schemaPath: "#/properties/max_requests/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
            if (typeof data2 == "number" && isFinite(data2)) {
              if (data2 > 9007199254740991 || isNaN(data2)) {
                const err11 = { instancePath: instancePath + "/max_requests", schemaPath: "#/properties/max_requests/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err11];
                } else {
                  vErrors.push(err11);
                }
                errors++;
              }
              if (data2 < 0 || isNaN(data2)) {
                const err12 = { instancePath: instancePath + "/max_requests", schemaPath: "#/properties/max_requests/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err12];
                } else {
                  vErrors.push(err12);
                }
                errors++;
              }
            }
          }
          if (data.arrival_policy !== void 0) {
            let data3 = data.arrival_policy;
            if (typeof data3 !== "string") {
              const err13 = { instancePath: instancePath + "/arrival_policy", schemaPath: "#/properties/arrival_policy/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            if ("single-at-zero" !== data3) {
              const err14 = { instancePath: instancePath + "/arrival_policy", schemaPath: "#/properties/arrival_policy/const", keyword: "const", params: { allowedValue: "single-at-zero" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
          }
        } else {
          const err15 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
        validate23.errors = vErrors;
        return errors === 0;
      }
      validate23.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.GenerationPolicy = validate24;
      function validate24(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate24.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.max_new_tokens === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "max_new_tokens" }, message: "must have required property 'max_new_tokens'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.selection === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "selection" }, message: "must have required property 'selection'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.stopping === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "stopping" }, message: "must have required property 'stopping'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "max_new_tokens" || key0 === "selection" || key0 === "stopping")) {
              const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
          }
          if (data.max_new_tokens !== void 0) {
            let data0 = data.max_new_tokens;
            if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)) && isFinite(data0))) {
              const err4 = { instancePath: instancePath + "/max_new_tokens", schemaPath: "#/properties/max_new_tokens/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
            if (typeof data0 == "number" && isFinite(data0)) {
              if (data0 < 1 || isNaN(data0)) {
                const err5 = { instancePath: instancePath + "/max_new_tokens", schemaPath: "#/properties/max_new_tokens/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                if (vErrors === null) {
                  vErrors = [err5];
                } else {
                  vErrors.push(err5);
                }
                errors++;
              }
            }
          }
          if (data.selection !== void 0) {
            let data1 = data.selection;
            if (typeof data1 !== "string") {
              const err6 = { instancePath: instancePath + "/selection", schemaPath: "#/properties/selection/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            if ("greedy-lowest-id-tie" !== data1) {
              const err7 = { instancePath: instancePath + "/selection", schemaPath: "#/properties/selection/const", keyword: "const", params: { allowedValue: "greedy-lowest-id-tie" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
          if (data.stopping !== void 0) {
            let data2 = data.stopping;
            if (typeof data2 !== "string") {
              const err8 = { instancePath: instancePath + "/stopping", schemaPath: "#/properties/stopping/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            if ("turn-end-or-budget" !== data2) {
              const err9 = { instancePath: instancePath + "/stopping", schemaPath: "#/properties/stopping/const", keyword: "const", params: { allowedValue: "turn-end-or-budget" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            }
          }
        } else {
          const err10 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        validate24.errors = vErrors;
        return errors === 0;
      }
      validate24.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.InferenceRequest = validate25;
      function validate25(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate25.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.text === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "text" }, message: "must have required property 'text'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.generation === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "generation" }, message: "must have required property 'generation'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "text" || key0 === "generation")) {
              const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
          }
          if (data.text !== void 0) {
            if (typeof data.text !== "string") {
              const err3 = { instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
          }
          if (data.generation !== void 0) {
            let data1 = data.generation;
            if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
              if (data1.max_new_tokens === void 0) {
                const err4 = { instancePath: instancePath + "/generation", schemaPath: "#/$defs/GenerationPolicy/required", keyword: "required", params: { missingProperty: "max_new_tokens" }, message: "must have required property 'max_new_tokens'" };
                if (vErrors === null) {
                  vErrors = [err4];
                } else {
                  vErrors.push(err4);
                }
                errors++;
              }
              if (data1.selection === void 0) {
                const err5 = { instancePath: instancePath + "/generation", schemaPath: "#/$defs/GenerationPolicy/required", keyword: "required", params: { missingProperty: "selection" }, message: "must have required property 'selection'" };
                if (vErrors === null) {
                  vErrors = [err5];
                } else {
                  vErrors.push(err5);
                }
                errors++;
              }
              if (data1.stopping === void 0) {
                const err6 = { instancePath: instancePath + "/generation", schemaPath: "#/$defs/GenerationPolicy/required", keyword: "required", params: { missingProperty: "stopping" }, message: "must have required property 'stopping'" };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
              for (const key1 in data1) {
                if (!(key1 === "max_new_tokens" || key1 === "selection" || key1 === "stopping")) {
                  const err7 = { instancePath: instancePath + "/generation", schemaPath: "#/$defs/GenerationPolicy/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err7];
                  } else {
                    vErrors.push(err7);
                  }
                  errors++;
                }
              }
              if (data1.max_new_tokens !== void 0) {
                let data2 = data1.max_new_tokens;
                if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                  const err8 = { instancePath: instancePath + "/generation/max_new_tokens", schemaPath: "#/$defs/GenerationPolicy/properties/max_new_tokens/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                }
                if (typeof data2 == "number" && isFinite(data2)) {
                  if (data2 < 1 || isNaN(data2)) {
                    const err9 = { instancePath: instancePath + "/generation/max_new_tokens", schemaPath: "#/$defs/GenerationPolicy/properties/max_new_tokens/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                    if (vErrors === null) {
                      vErrors = [err9];
                    } else {
                      vErrors.push(err9);
                    }
                    errors++;
                  }
                }
              }
              if (data1.selection !== void 0) {
                let data3 = data1.selection;
                if (typeof data3 !== "string") {
                  const err10 = { instancePath: instancePath + "/generation/selection", schemaPath: "#/$defs/GenerationPolicy/properties/selection/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
                if ("greedy-lowest-id-tie" !== data3) {
                  const err11 = { instancePath: instancePath + "/generation/selection", schemaPath: "#/$defs/GenerationPolicy/properties/selection/const", keyword: "const", params: { allowedValue: "greedy-lowest-id-tie" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err11];
                  } else {
                    vErrors.push(err11);
                  }
                  errors++;
                }
              }
              if (data1.stopping !== void 0) {
                let data4 = data1.stopping;
                if (typeof data4 !== "string") {
                  const err12 = { instancePath: instancePath + "/generation/stopping", schemaPath: "#/$defs/GenerationPolicy/properties/stopping/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err12];
                  } else {
                    vErrors.push(err12);
                  }
                  errors++;
                }
                if ("turn-end-or-budget" !== data4) {
                  const err13 = { instancePath: instancePath + "/generation/stopping", schemaPath: "#/$defs/GenerationPolicy/properties/stopping/const", keyword: "const", params: { allowedValue: "turn-end-or-budget" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err13];
                  } else {
                    vErrors.push(err13);
                  }
                  errors++;
                }
              }
            } else {
              const err14 = { instancePath: instancePath + "/generation", schemaPath: "#/$defs/GenerationPolicy/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
          }
        } else {
          const err15 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
        validate25.errors = vErrors;
        return errors === 0;
      }
      validate25.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.RunOutcome = validate26;
      var schema39 = { "type": "object", "x-owner": "RunOutcome", "additionalProperties": false, "required": ["selected_tokens", "delivered_tokens", "unused_budget", "stop_reason", "complete"], "properties": { "selected_tokens": { "type": "integer", "title": "Selected IDs", "description": "Includes terminal controls.", "minimum": 1 }, "delivered_tokens": { "type": "integer", "title": "Delivered IDs", "description": "Every selected ID except TURN_END, including diagnostic control/byte/hex tokens.", "minimum": 0 }, "unused_budget": { "type": "integer", "title": "Unused allowance", "description": "Requested ceiling minus actual selected ID count.", "minimum": 0 }, "stop_reason": { "type": "string", "title": "Termination condition", "description": "Recorded by the execution loop.", "enum": ["turn_end", "output_budget"] }, "complete": { "type": "boolean", "title": "Turn complete", "description": "True only if TURN_END was selected." } } };
      function validate26(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate26.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.selected_tokens === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "selected_tokens" }, message: "must have required property 'selected_tokens'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.delivered_tokens === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "delivered_tokens" }, message: "must have required property 'delivered_tokens'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.unused_budget === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "unused_budget" }, message: "must have required property 'unused_budget'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          if (data.stop_reason === void 0) {
            const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "stop_reason" }, message: "must have required property 'stop_reason'" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
          if (data.complete === void 0) {
            const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "complete" }, message: "must have required property 'complete'" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "selected_tokens" || key0 === "delivered_tokens" || key0 === "unused_budget" || key0 === "stop_reason" || key0 === "complete")) {
              const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
          }
          if (data.selected_tokens !== void 0) {
            let data0 = data.selected_tokens;
            if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)) && isFinite(data0))) {
              const err6 = { instancePath: instancePath + "/selected_tokens", schemaPath: "#/properties/selected_tokens/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            if (typeof data0 == "number" && isFinite(data0)) {
              if (data0 < 1 || isNaN(data0)) {
                const err7 = { instancePath: instancePath + "/selected_tokens", schemaPath: "#/properties/selected_tokens/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                if (vErrors === null) {
                  vErrors = [err7];
                } else {
                  vErrors.push(err7);
                }
                errors++;
              }
            }
          }
          if (data.delivered_tokens !== void 0) {
            let data1 = data.delivered_tokens;
            if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
              const err8 = { instancePath: instancePath + "/delivered_tokens", schemaPath: "#/properties/delivered_tokens/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            if (typeof data1 == "number" && isFinite(data1)) {
              if (data1 < 0 || isNaN(data1)) {
                const err9 = { instancePath: instancePath + "/delivered_tokens", schemaPath: "#/properties/delivered_tokens/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err9];
                } else {
                  vErrors.push(err9);
                }
                errors++;
              }
            }
          }
          if (data.unused_budget !== void 0) {
            let data2 = data.unused_budget;
            if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
              const err10 = { instancePath: instancePath + "/unused_budget", schemaPath: "#/properties/unused_budget/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
            if (typeof data2 == "number" && isFinite(data2)) {
              if (data2 < 0 || isNaN(data2)) {
                const err11 = { instancePath: instancePath + "/unused_budget", schemaPath: "#/properties/unused_budget/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err11];
                } else {
                  vErrors.push(err11);
                }
                errors++;
              }
            }
          }
          if (data.stop_reason !== void 0) {
            let data3 = data.stop_reason;
            if (typeof data3 !== "string") {
              const err12 = { instancePath: instancePath + "/stop_reason", schemaPath: "#/properties/stop_reason/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
            if (!(data3 === "turn_end" || data3 === "output_budget")) {
              const err13 = { instancePath: instancePath + "/stop_reason", schemaPath: "#/properties/stop_reason/enum", keyword: "enum", params: { allowedValues: schema39.properties.stop_reason.enum }, message: "must be equal to one of the allowed values" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
          }
          if (data.complete !== void 0) {
            if (typeof data.complete !== "boolean") {
              const err14 = { instancePath: instancePath + "/complete", schemaPath: "#/properties/complete/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
          }
        } else {
          const err15 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
        validate26.errors = vErrors;
        return errors === 0;
      }
      validate26.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.InspectionState = validate27;
      function validate27(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate27.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.run_id === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "run_id" }, message: "must have required property 'run_id'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.prediction === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "prediction" }, message: "must have required property 'prediction'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.position === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "position" }, message: "must have required property 'position'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "run_id" || key0 === "prediction" || key0 === "position")) {
              const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
          }
          if (data.run_id !== void 0) {
            let data0 = data.run_id;
            if (typeof data0 === "string") {
              if (!pattern4.test(data0)) {
                const err4 = { instancePath: instancePath + "/run_id", schemaPath: "#/properties/run_id/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{64}$" }, message: 'must match pattern "^[0-9a-f]{64}$"' };
                if (vErrors === null) {
                  vErrors = [err4];
                } else {
                  vErrors.push(err4);
                }
                errors++;
              }
            } else {
              const err5 = { instancePath: instancePath + "/run_id", schemaPath: "#/properties/run_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
          }
          if (data.prediction !== void 0) {
            let data1 = data.prediction;
            if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
              const err6 = { instancePath: instancePath + "/prediction", schemaPath: "#/properties/prediction/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            if (typeof data1 == "number" && isFinite(data1)) {
              if (data1 < 0 || isNaN(data1)) {
                const err7 = { instancePath: instancePath + "/prediction", schemaPath: "#/properties/prediction/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err7];
                } else {
                  vErrors.push(err7);
                }
                errors++;
              }
            }
          }
          if (data.position !== void 0) {
            let data2 = data.position;
            if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
              const err8 = { instancePath: instancePath + "/position", schemaPath: "#/properties/position/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            if (typeof data2 == "number" && isFinite(data2)) {
              if (data2 < 0 || isNaN(data2)) {
                const err9 = { instancePath: instancePath + "/position", schemaPath: "#/properties/position/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err9];
                } else {
                  vErrors.push(err9);
                }
                errors++;
              }
            }
          }
        } else {
          const err10 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        validate27.errors = vErrors;
        return errors === 0;
      }
      validate27.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.RequestBinding = validate28;
      function validate28(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate28.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.model === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "model" }, message: "must have required property 'model'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.system === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "system" }, message: "must have required property 'system'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.request === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "request" }, message: "must have required property 'request'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "model" || key0 === "system" || key0 === "request")) {
              const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
          }
          if (data.model !== void 0) {
            if (!validate22(data.model, { instancePath: instancePath + "/model", parentData: data, parentDataProperty: "model", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
              errors = vErrors.length;
            }
          }
          if (data.system !== void 0) {
            let data1 = data.system;
            if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
              if (data1.execution === void 0) {
                const err4 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/required", keyword: "required", params: { missingProperty: "execution" }, message: "must have required property 'execution'" };
                if (vErrors === null) {
                  vErrors = [err4];
                } else {
                  vErrors.push(err4);
                }
                errors++;
              }
              if (data1.max_new_tokens_cap === void 0) {
                const err5 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/required", keyword: "required", params: { missingProperty: "max_new_tokens_cap" }, message: "must have required property 'max_new_tokens_cap'" };
                if (vErrors === null) {
                  vErrors = [err5];
                } else {
                  vErrors.push(err5);
                }
                errors++;
              }
              if (data1.max_requests === void 0) {
                const err6 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/required", keyword: "required", params: { missingProperty: "max_requests" }, message: "must have required property 'max_requests'" };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
              if (data1.arrival_policy === void 0) {
                const err7 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/required", keyword: "required", params: { missingProperty: "arrival_policy" }, message: "must have required property 'arrival_policy'" };
                if (vErrors === null) {
                  vErrors = [err7];
                } else {
                  vErrors.push(err7);
                }
                errors++;
              }
              for (const key1 in data1) {
                if (!(key1 === "execution" || key1 === "max_new_tokens_cap" || key1 === "max_requests" || key1 === "arrival_policy")) {
                  const err8 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                }
              }
              if (data1.execution !== void 0) {
                let data2 = data1.execution;
                if (typeof data2 !== "string") {
                  const err9 = { instancePath: instancePath + "/system/execution", schemaPath: "#/$defs/InferenceSystem/properties/execution/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err9];
                  } else {
                    vErrors.push(err9);
                  }
                  errors++;
                }
                if ("full-prefix-recomputation" !== data2) {
                  const err10 = { instancePath: instancePath + "/system/execution", schemaPath: "#/$defs/InferenceSystem/properties/execution/const", keyword: "const", params: { allowedValue: "full-prefix-recomputation" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
              }
              if (data1.max_new_tokens_cap !== void 0) {
                let data3 = data1.max_new_tokens_cap;
                if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                  const err11 = { instancePath: instancePath + "/system/max_new_tokens_cap", schemaPath: "#/$defs/InferenceSystem/properties/max_new_tokens_cap/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err11];
                  } else {
                    vErrors.push(err11);
                  }
                  errors++;
                }
                if (8 !== data3) {
                  const err12 = { instancePath: instancePath + "/system/max_new_tokens_cap", schemaPath: "#/$defs/InferenceSystem/properties/max_new_tokens_cap/const", keyword: "const", params: { allowedValue: 8 }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err12];
                  } else {
                    vErrors.push(err12);
                  }
                  errors++;
                }
              }
              if (data1.max_requests !== void 0) {
                let data4 = data1.max_requests;
                if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
                  const err13 = { instancePath: instancePath + "/system/max_requests", schemaPath: "#/$defs/InferenceSystem/properties/max_requests/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err13];
                  } else {
                    vErrors.push(err13);
                  }
                  errors++;
                }
                if (1 !== data4) {
                  const err14 = { instancePath: instancePath + "/system/max_requests", schemaPath: "#/$defs/InferenceSystem/properties/max_requests/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err14];
                  } else {
                    vErrors.push(err14);
                  }
                  errors++;
                }
                if (typeof data4 == "number" && isFinite(data4)) {
                  if (data4 > 9007199254740991 || isNaN(data4)) {
                    const err15 = { instancePath: instancePath + "/system/max_requests", schemaPath: "#/$defs/InferenceSystem/properties/max_requests/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                    if (vErrors === null) {
                      vErrors = [err15];
                    } else {
                      vErrors.push(err15);
                    }
                    errors++;
                  }
                  if (data4 < 0 || isNaN(data4)) {
                    const err16 = { instancePath: instancePath + "/system/max_requests", schemaPath: "#/$defs/InferenceSystem/properties/max_requests/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                    if (vErrors === null) {
                      vErrors = [err16];
                    } else {
                      vErrors.push(err16);
                    }
                    errors++;
                  }
                }
              }
              if (data1.arrival_policy !== void 0) {
                let data5 = data1.arrival_policy;
                if (typeof data5 !== "string") {
                  const err17 = { instancePath: instancePath + "/system/arrival_policy", schemaPath: "#/$defs/InferenceSystem/properties/arrival_policy/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                }
                if ("single-at-zero" !== data5) {
                  const err18 = { instancePath: instancePath + "/system/arrival_policy", schemaPath: "#/$defs/InferenceSystem/properties/arrival_policy/const", keyword: "const", params: { allowedValue: "single-at-zero" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err18];
                  } else {
                    vErrors.push(err18);
                  }
                  errors++;
                }
              }
            } else {
              const err19 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
          }
          if (data.request !== void 0) {
            if (!validate25(data.request, { instancePath: instancePath + "/request", parentData: data, parentDataProperty: "request", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err20 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err20];
          } else {
            vErrors.push(err20);
          }
          errors++;
        }
        validate28.errors = vErrors;
        return errors === 0;
      }
      validate28.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.ScheduledRequest = validate31;
      var pattern7 = new RegExp("^[a-z][a-z0-9-]*$", "u");
      function validate31(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate31.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.request_id === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "request_id" }, message: "must have required property 'request_id'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.arrival_us === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "arrival_us" }, message: "must have required property 'arrival_us'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.request === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "request" }, message: "must have required property 'request'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "request_id" || key0 === "arrival_us" || key0 === "request")) {
              const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
          }
          if (data.request_id !== void 0) {
            let data0 = data.request_id;
            if (typeof data0 === "string") {
              if (!pattern7.test(data0)) {
                const err4 = { instancePath: instancePath + "/request_id", schemaPath: "#/properties/request_id/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*$" }, message: 'must match pattern "^[a-z][a-z0-9-]*$"' };
                if (vErrors === null) {
                  vErrors = [err4];
                } else {
                  vErrors.push(err4);
                }
                errors++;
              }
            } else {
              const err5 = { instancePath: instancePath + "/request_id", schemaPath: "#/properties/request_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
          }
          if (data.arrival_us !== void 0) {
            let data1 = data.arrival_us;
            if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
              const err6 = { instancePath: instancePath + "/arrival_us", schemaPath: "#/properties/arrival_us/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            if (typeof data1 == "number" && isFinite(data1)) {
              if (data1 > 9007199254740991 || isNaN(data1)) {
                const err7 = { instancePath: instancePath + "/arrival_us", schemaPath: "#/properties/arrival_us/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err7];
                } else {
                  vErrors.push(err7);
                }
                errors++;
              }
              if (data1 < 0 || isNaN(data1)) {
                const err8 = { instancePath: instancePath + "/arrival_us", schemaPath: "#/properties/arrival_us/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err8];
                } else {
                  vErrors.push(err8);
                }
                errors++;
              }
            }
          }
          if (data.request !== void 0) {
            if (!validate25(data.request, { instancePath: instancePath + "/request", parentData: data, parentDataProperty: "request", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        validate31.errors = vErrors;
        return errors === 0;
      }
      validate31.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.Workload = validate33;
      function validate33(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate33.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.requests === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "requests" }, message: "must have required property 'requests'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "kind" || key0 === "requests")) {
              const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
          }
          if (data.kind !== void 0) {
            let data0 = data.kind;
            if (typeof data0 !== "string") {
              const err3 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
            if ("fixed-arrivals" !== data0) {
              const err4 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "fixed-arrivals" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
          }
          if (data.requests !== void 0) {
            let data1 = data.requests;
            if (Array.isArray(data1)) {
              if (data1.length < 1) {
                const err5 = { instancePath: instancePath + "/requests", schemaPath: "#/properties/requests/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                if (vErrors === null) {
                  vErrors = [err5];
                } else {
                  vErrors.push(err5);
                }
                errors++;
              }
              const len0 = data1.length;
              for (let i0 = 0; i0 < len0; i0++) {
                if (!validate31(data1[i0], { instancePath: instancePath + "/requests/" + i0, parentData: data1, parentDataProperty: i0, rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
                  errors = vErrors.length;
                }
              }
            } else {
              const err6 = { instancePath: instancePath + "/requests", schemaPath: "#/properties/requests/type", keyword: "type", params: { type: "array" }, message: "must be array" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
          }
        } else {
          const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
        validate33.errors = vErrors;
        return errors === 0;
      }
      validate33.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.RunBinding = validate35;
      function validate35(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate35.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.model === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "model" }, message: "must have required property 'model'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.system === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "system" }, message: "must have required property 'system'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.workload === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "workload" }, message: "must have required property 'workload'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "model" || key0 === "system" || key0 === "workload")) {
              const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
          }
          if (data.model !== void 0) {
            if (!validate22(data.model, { instancePath: instancePath + "/model", parentData: data, parentDataProperty: "model", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
              errors = vErrors.length;
            }
          }
          if (data.system !== void 0) {
            let data1 = data.system;
            if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
              if (data1.execution === void 0) {
                const err4 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/required", keyword: "required", params: { missingProperty: "execution" }, message: "must have required property 'execution'" };
                if (vErrors === null) {
                  vErrors = [err4];
                } else {
                  vErrors.push(err4);
                }
                errors++;
              }
              if (data1.max_new_tokens_cap === void 0) {
                const err5 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/required", keyword: "required", params: { missingProperty: "max_new_tokens_cap" }, message: "must have required property 'max_new_tokens_cap'" };
                if (vErrors === null) {
                  vErrors = [err5];
                } else {
                  vErrors.push(err5);
                }
                errors++;
              }
              if (data1.max_requests === void 0) {
                const err6 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/required", keyword: "required", params: { missingProperty: "max_requests" }, message: "must have required property 'max_requests'" };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
              if (data1.arrival_policy === void 0) {
                const err7 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/required", keyword: "required", params: { missingProperty: "arrival_policy" }, message: "must have required property 'arrival_policy'" };
                if (vErrors === null) {
                  vErrors = [err7];
                } else {
                  vErrors.push(err7);
                }
                errors++;
              }
              for (const key1 in data1) {
                if (!(key1 === "execution" || key1 === "max_new_tokens_cap" || key1 === "max_requests" || key1 === "arrival_policy")) {
                  const err8 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                }
              }
              if (data1.execution !== void 0) {
                let data2 = data1.execution;
                if (typeof data2 !== "string") {
                  const err9 = { instancePath: instancePath + "/system/execution", schemaPath: "#/$defs/InferenceSystem/properties/execution/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err9];
                  } else {
                    vErrors.push(err9);
                  }
                  errors++;
                }
                if ("full-prefix-recomputation" !== data2) {
                  const err10 = { instancePath: instancePath + "/system/execution", schemaPath: "#/$defs/InferenceSystem/properties/execution/const", keyword: "const", params: { allowedValue: "full-prefix-recomputation" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
              }
              if (data1.max_new_tokens_cap !== void 0) {
                let data3 = data1.max_new_tokens_cap;
                if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                  const err11 = { instancePath: instancePath + "/system/max_new_tokens_cap", schemaPath: "#/$defs/InferenceSystem/properties/max_new_tokens_cap/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err11];
                  } else {
                    vErrors.push(err11);
                  }
                  errors++;
                }
                if (8 !== data3) {
                  const err12 = { instancePath: instancePath + "/system/max_new_tokens_cap", schemaPath: "#/$defs/InferenceSystem/properties/max_new_tokens_cap/const", keyword: "const", params: { allowedValue: 8 }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err12];
                  } else {
                    vErrors.push(err12);
                  }
                  errors++;
                }
              }
              if (data1.max_requests !== void 0) {
                let data4 = data1.max_requests;
                if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
                  const err13 = { instancePath: instancePath + "/system/max_requests", schemaPath: "#/$defs/InferenceSystem/properties/max_requests/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err13];
                  } else {
                    vErrors.push(err13);
                  }
                  errors++;
                }
                if (1 !== data4) {
                  const err14 = { instancePath: instancePath + "/system/max_requests", schemaPath: "#/$defs/InferenceSystem/properties/max_requests/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err14];
                  } else {
                    vErrors.push(err14);
                  }
                  errors++;
                }
                if (typeof data4 == "number" && isFinite(data4)) {
                  if (data4 > 9007199254740991 || isNaN(data4)) {
                    const err15 = { instancePath: instancePath + "/system/max_requests", schemaPath: "#/$defs/InferenceSystem/properties/max_requests/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                    if (vErrors === null) {
                      vErrors = [err15];
                    } else {
                      vErrors.push(err15);
                    }
                    errors++;
                  }
                  if (data4 < 0 || isNaN(data4)) {
                    const err16 = { instancePath: instancePath + "/system/max_requests", schemaPath: "#/$defs/InferenceSystem/properties/max_requests/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                    if (vErrors === null) {
                      vErrors = [err16];
                    } else {
                      vErrors.push(err16);
                    }
                    errors++;
                  }
                }
              }
              if (data1.arrival_policy !== void 0) {
                let data5 = data1.arrival_policy;
                if (typeof data5 !== "string") {
                  const err17 = { instancePath: instancePath + "/system/arrival_policy", schemaPath: "#/$defs/InferenceSystem/properties/arrival_policy/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                }
                if ("single-at-zero" !== data5) {
                  const err18 = { instancePath: instancePath + "/system/arrival_policy", schemaPath: "#/$defs/InferenceSystem/properties/arrival_policy/const", keyword: "const", params: { allowedValue: "single-at-zero" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err18];
                  } else {
                    vErrors.push(err18);
                  }
                  errors++;
                }
              }
            } else {
              const err19 = { instancePath: instancePath + "/system", schemaPath: "#/$defs/InferenceSystem/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
          }
          if (data.workload !== void 0) {
            if (!validate33(data.workload, { instancePath: instancePath + "/workload", parentData: data, parentDataProperty: "workload", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate33.errors : vErrors.concat(validate33.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err20 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err20];
          } else {
            vErrors.push(err20);
          }
          errors++;
        }
        validate35.errors = vErrors;
        return errors === 0;
      }
      validate35.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.EventClock = validate38;
      function validate38(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate38.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "kind")) {
              const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err1];
              } else {
                vErrors.push(err1);
              }
              errors++;
            }
          }
          if (data.kind !== void 0) {
            let data0 = data.kind;
            if (typeof data0 !== "string") {
              const err2 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
            if ("execution-order" !== data0) {
              const err3 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "execution-order" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
          }
        } else {
          const err4 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        validate38.errors = vErrors;
        return errors === 0;
      }
      validate38.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.RequestArrived = validate39;
      function validate39(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate39.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.arrival_us === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "arrival_us" }, message: "must have required property 'arrival_us'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "kind" || key0 === "arrival_us")) {
              const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
          }
          if (data.kind !== void 0) {
            let data0 = data.kind;
            if (typeof data0 !== "string") {
              const err3 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
            if ("request-arrived" !== data0) {
              const err4 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "request-arrived" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
          }
          if (data.arrival_us !== void 0) {
            let data1 = data.arrival_us;
            if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
              const err5 = { instancePath: instancePath + "/arrival_us", schemaPath: "#/properties/arrival_us/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if (typeof data1 == "number" && isFinite(data1)) {
              if (data1 > 9007199254740991 || isNaN(data1)) {
                const err6 = { instancePath: instancePath + "/arrival_us", schemaPath: "#/properties/arrival_us/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
              if (data1 < 0 || isNaN(data1)) {
                const err7 = { instancePath: instancePath + "/arrival_us", schemaPath: "#/properties/arrival_us/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err7];
                } else {
                  vErrors.push(err7);
                }
                errors++;
              }
            }
          }
        } else {
          const err8 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        validate39.errors = vErrors;
        return errors === 0;
      }
      validate39.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.InputEncoded = validate40;
      function validate40(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate40.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.input_sha256 === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "input_sha256" }, message: "must have required property 'input_sha256'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.token_count === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "token_count" }, message: "must have required property 'token_count'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "kind" || key0 === "input_sha256" || key0 === "token_count")) {
              const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
          }
          if (data.kind !== void 0) {
            let data0 = data.kind;
            if (typeof data0 !== "string") {
              const err4 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
            if ("input-encoded" !== data0) {
              const err5 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "input-encoded" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
          }
          if (data.input_sha256 !== void 0) {
            let data1 = data.input_sha256;
            if (typeof data1 === "string") {
              if (!pattern4.test(data1)) {
                const err6 = { instancePath: instancePath + "/input_sha256", schemaPath: "#/properties/input_sha256/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{64}$" }, message: 'must match pattern "^[0-9a-f]{64}$"' };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
            } else {
              const err7 = { instancePath: instancePath + "/input_sha256", schemaPath: "#/properties/input_sha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
          if (data.token_count !== void 0) {
            let data2 = data.token_count;
            if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
              const err8 = { instancePath: instancePath + "/token_count", schemaPath: "#/properties/token_count/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            if (typeof data2 == "number" && isFinite(data2)) {
              if (data2 > 9007199254740991 || isNaN(data2)) {
                const err9 = { instancePath: instancePath + "/token_count", schemaPath: "#/properties/token_count/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err9];
                } else {
                  vErrors.push(err9);
                }
                errors++;
              }
              if (data2 < 0 || isNaN(data2)) {
                const err10 = { instancePath: instancePath + "/token_count", schemaPath: "#/properties/token_count/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err10];
                } else {
                  vErrors.push(err10);
                }
                errors++;
              }
            }
          }
        } else {
          const err11 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        validate40.errors = vErrors;
        return errors === 0;
      }
      validate40.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.WorkCompleted = validate41;
      var schema50 = { "type": "object", "x-owner": "RunEvent", "additionalProperties": false, "required": ["kind", "work_id", "phase"], "properties": { "kind": { "type": "string", "title": "Event kind", "description": "Event kind", "const": "work-completed", "default": "work-completed" }, "work_id": { "type": "string", "title": "Numerical observation identity", "description": "Numerical observation identity" }, "phase": { "type": "string", "title": "Execution phase", "description": "Execution phase", "enum": ["prefill", "decode"] } } };
      function validate41(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate41.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.work_id === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "work_id" }, message: "must have required property 'work_id'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.phase === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "phase" }, message: "must have required property 'phase'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "kind" || key0 === "work_id" || key0 === "phase")) {
              const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
          }
          if (data.kind !== void 0) {
            let data0 = data.kind;
            if (typeof data0 !== "string") {
              const err4 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
            if ("work-completed" !== data0) {
              const err5 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "work-completed" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
          }
          if (data.work_id !== void 0) {
            if (typeof data.work_id !== "string") {
              const err6 = { instancePath: instancePath + "/work_id", schemaPath: "#/properties/work_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
          }
          if (data.phase !== void 0) {
            let data2 = data.phase;
            if (typeof data2 !== "string") {
              const err7 = { instancePath: instancePath + "/phase", schemaPath: "#/properties/phase/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            if (!(data2 === "prefill" || data2 === "decode")) {
              const err8 = { instancePath: instancePath + "/phase", schemaPath: "#/properties/phase/enum", keyword: "enum", params: { allowedValues: schema50.properties.phase.enum }, message: "must be equal to one of the allowed values" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
          }
        } else {
          const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        validate41.errors = vErrors;
        return errors === 0;
      }
      validate41.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.TokenSelected = validate42;
      function validate42(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate42.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.work_id === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "work_id" }, message: "must have required property 'work_id'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.token_id === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "token_id" }, message: "must have required property 'token_id'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          if (data.output_position === void 0) {
            const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "output_position" }, message: "must have required property 'output_position'" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "kind" || key0 === "work_id" || key0 === "token_id" || key0 === "output_position")) {
              const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
          }
          if (data.kind !== void 0) {
            let data0 = data.kind;
            if (typeof data0 !== "string") {
              const err5 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if ("token-selected" !== data0) {
              const err6 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "token-selected" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
          }
          if (data.work_id !== void 0) {
            if (typeof data.work_id !== "string") {
              const err7 = { instancePath: instancePath + "/work_id", schemaPath: "#/properties/work_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
          if (data.token_id !== void 0) {
            let data2 = data.token_id;
            if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
              const err8 = { instancePath: instancePath + "/token_id", schemaPath: "#/properties/token_id/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            if (typeof data2 == "number" && isFinite(data2)) {
              if (data2 > 9007199254740991 || isNaN(data2)) {
                const err9 = { instancePath: instancePath + "/token_id", schemaPath: "#/properties/token_id/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err9];
                } else {
                  vErrors.push(err9);
                }
                errors++;
              }
              if (data2 < 0 || isNaN(data2)) {
                const err10 = { instancePath: instancePath + "/token_id", schemaPath: "#/properties/token_id/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err10];
                } else {
                  vErrors.push(err10);
                }
                errors++;
              }
            }
          }
          if (data.output_position !== void 0) {
            let data3 = data.output_position;
            if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
              const err11 = { instancePath: instancePath + "/output_position", schemaPath: "#/properties/output_position/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
            if (typeof data3 == "number" && isFinite(data3)) {
              if (data3 > 9007199254740991 || isNaN(data3)) {
                const err12 = { instancePath: instancePath + "/output_position", schemaPath: "#/properties/output_position/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err12];
                } else {
                  vErrors.push(err12);
                }
                errors++;
              }
              if (data3 < 0 || isNaN(data3)) {
                const err13 = { instancePath: instancePath + "/output_position", schemaPath: "#/properties/output_position/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err13];
                } else {
                  vErrors.push(err13);
                }
                errors++;
              }
            }
          }
        } else {
          const err14 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        validate42.errors = vErrors;
        return errors === 0;
      }
      validate42.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.TokenCommitted = validate43;
      function validate43(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate43.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.work_id === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "work_id" }, message: "must have required property 'work_id'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.token_ids === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "token_ids" }, message: "must have required property 'token_ids'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          if (data.output_start === void 0) {
            const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "output_start" }, message: "must have required property 'output_start'" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "kind" || key0 === "work_id" || key0 === "token_ids" || key0 === "output_start")) {
              const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
          }
          if (data.kind !== void 0) {
            let data0 = data.kind;
            if (typeof data0 !== "string") {
              const err5 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if ("token-committed" !== data0) {
              const err6 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "token-committed" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
          }
          if (data.work_id !== void 0) {
            if (typeof data.work_id !== "string") {
              const err7 = { instancePath: instancePath + "/work_id", schemaPath: "#/properties/work_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
          if (data.token_ids !== void 0) {
            let data2 = data.token_ids;
            if (Array.isArray(data2)) {
              if (data2.length < 1) {
                const err8 = { instancePath: instancePath + "/token_ids", schemaPath: "#/properties/token_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                if (vErrors === null) {
                  vErrors = [err8];
                } else {
                  vErrors.push(err8);
                }
                errors++;
              }
              const len0 = data2.length;
              for (let i0 = 0; i0 < len0; i0++) {
                let data3 = data2[i0];
                if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                  const err9 = { instancePath: instancePath + "/token_ids/" + i0, schemaPath: "#/properties/token_ids/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err9];
                  } else {
                    vErrors.push(err9);
                  }
                  errors++;
                }
                if (typeof data3 == "number" && isFinite(data3)) {
                  if (data3 > 9007199254740991 || isNaN(data3)) {
                    const err10 = { instancePath: instancePath + "/token_ids/" + i0, schemaPath: "#/properties/token_ids/items/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                    if (vErrors === null) {
                      vErrors = [err10];
                    } else {
                      vErrors.push(err10);
                    }
                    errors++;
                  }
                  if (data3 < 0 || isNaN(data3)) {
                    const err11 = { instancePath: instancePath + "/token_ids/" + i0, schemaPath: "#/properties/token_ids/items/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                    if (vErrors === null) {
                      vErrors = [err11];
                    } else {
                      vErrors.push(err11);
                    }
                    errors++;
                  }
                }
              }
            } else {
              const err12 = { instancePath: instancePath + "/token_ids", schemaPath: "#/properties/token_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
          }
          if (data.output_start !== void 0) {
            let data4 = data.output_start;
            if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
              const err13 = { instancePath: instancePath + "/output_start", schemaPath: "#/properties/output_start/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            if (typeof data4 == "number" && isFinite(data4)) {
              if (data4 > 9007199254740991 || isNaN(data4)) {
                const err14 = { instancePath: instancePath + "/output_start", schemaPath: "#/properties/output_start/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err14];
                } else {
                  vErrors.push(err14);
                }
                errors++;
              }
              if (data4 < 0 || isNaN(data4)) {
                const err15 = { instancePath: instancePath + "/output_start", schemaPath: "#/properties/output_start/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err15];
                } else {
                  vErrors.push(err15);
                }
                errors++;
              }
            }
          }
        } else {
          const err16 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
        validate43.errors = vErrors;
        return errors === 0;
      }
      validate43.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.TokenDelivered = validate44;
      function validate44(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate44.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.work_id === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "work_id" }, message: "must have required property 'work_id'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.token_ids === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "token_ids" }, message: "must have required property 'token_ids'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          if (data.output_start === void 0) {
            const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "output_start" }, message: "must have required property 'output_start'" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
          if (data.display_delta === void 0) {
            const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "display_delta" }, message: "must have required property 'display_delta'" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "kind" || key0 === "work_id" || key0 === "token_ids" || key0 === "output_start" || key0 === "display_delta")) {
              const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
          }
          if (data.kind !== void 0) {
            let data0 = data.kind;
            if (typeof data0 !== "string") {
              const err6 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            if ("token-delivered" !== data0) {
              const err7 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "token-delivered" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
          if (data.work_id !== void 0) {
            if (typeof data.work_id !== "string") {
              const err8 = { instancePath: instancePath + "/work_id", schemaPath: "#/properties/work_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
          }
          if (data.token_ids !== void 0) {
            let data2 = data.token_ids;
            if (Array.isArray(data2)) {
              if (data2.length < 1) {
                const err9 = { instancePath: instancePath + "/token_ids", schemaPath: "#/properties/token_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                if (vErrors === null) {
                  vErrors = [err9];
                } else {
                  vErrors.push(err9);
                }
                errors++;
              }
              const len0 = data2.length;
              for (let i0 = 0; i0 < len0; i0++) {
                let data3 = data2[i0];
                if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                  const err10 = { instancePath: instancePath + "/token_ids/" + i0, schemaPath: "#/properties/token_ids/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
                if (typeof data3 == "number" && isFinite(data3)) {
                  if (data3 > 9007199254740991 || isNaN(data3)) {
                    const err11 = { instancePath: instancePath + "/token_ids/" + i0, schemaPath: "#/properties/token_ids/items/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                    if (vErrors === null) {
                      vErrors = [err11];
                    } else {
                      vErrors.push(err11);
                    }
                    errors++;
                  }
                  if (data3 < 0 || isNaN(data3)) {
                    const err12 = { instancePath: instancePath + "/token_ids/" + i0, schemaPath: "#/properties/token_ids/items/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                    if (vErrors === null) {
                      vErrors = [err12];
                    } else {
                      vErrors.push(err12);
                    }
                    errors++;
                  }
                }
              }
            } else {
              const err13 = { instancePath: instancePath + "/token_ids", schemaPath: "#/properties/token_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
          }
          if (data.output_start !== void 0) {
            let data4 = data.output_start;
            if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
              const err14 = { instancePath: instancePath + "/output_start", schemaPath: "#/properties/output_start/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (typeof data4 == "number" && isFinite(data4)) {
              if (data4 > 9007199254740991 || isNaN(data4)) {
                const err15 = { instancePath: instancePath + "/output_start", schemaPath: "#/properties/output_start/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err15];
                } else {
                  vErrors.push(err15);
                }
                errors++;
              }
              if (data4 < 0 || isNaN(data4)) {
                const err16 = { instancePath: instancePath + "/output_start", schemaPath: "#/properties/output_start/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err16];
                } else {
                  vErrors.push(err16);
                }
                errors++;
              }
            }
          }
          if (data.display_delta !== void 0) {
            if (typeof data.display_delta !== "string") {
              const err17 = { instancePath: instancePath + "/display_delta", schemaPath: "#/properties/display_delta/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
          }
        } else {
          const err18 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
        validate44.errors = vErrors;
        return errors === 0;
      }
      validate44.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.RequestFinished = validate45;
      function validate45(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate45.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.outcome === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "outcome" }, message: "must have required property 'outcome'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "kind" || key0 === "outcome")) {
              const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
          }
          if (data.kind !== void 0) {
            let data0 = data.kind;
            if (typeof data0 !== "string") {
              const err3 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
            if ("request-finished" !== data0) {
              const err4 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "request-finished" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
          }
          if (data.outcome !== void 0) {
            let data1 = data.outcome;
            if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
              if (data1.selected_tokens === void 0) {
                const err5 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/required", keyword: "required", params: { missingProperty: "selected_tokens" }, message: "must have required property 'selected_tokens'" };
                if (vErrors === null) {
                  vErrors = [err5];
                } else {
                  vErrors.push(err5);
                }
                errors++;
              }
              if (data1.delivered_tokens === void 0) {
                const err6 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/required", keyword: "required", params: { missingProperty: "delivered_tokens" }, message: "must have required property 'delivered_tokens'" };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
              if (data1.unused_budget === void 0) {
                const err7 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/required", keyword: "required", params: { missingProperty: "unused_budget" }, message: "must have required property 'unused_budget'" };
                if (vErrors === null) {
                  vErrors = [err7];
                } else {
                  vErrors.push(err7);
                }
                errors++;
              }
              if (data1.stop_reason === void 0) {
                const err8 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/required", keyword: "required", params: { missingProperty: "stop_reason" }, message: "must have required property 'stop_reason'" };
                if (vErrors === null) {
                  vErrors = [err8];
                } else {
                  vErrors.push(err8);
                }
                errors++;
              }
              if (data1.complete === void 0) {
                const err9 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/required", keyword: "required", params: { missingProperty: "complete" }, message: "must have required property 'complete'" };
                if (vErrors === null) {
                  vErrors = [err9];
                } else {
                  vErrors.push(err9);
                }
                errors++;
              }
              for (const key1 in data1) {
                if (!(key1 === "selected_tokens" || key1 === "delivered_tokens" || key1 === "unused_budget" || key1 === "stop_reason" || key1 === "complete")) {
                  const err10 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
              }
              if (data1.selected_tokens !== void 0) {
                let data2 = data1.selected_tokens;
                if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                  const err11 = { instancePath: instancePath + "/outcome/selected_tokens", schemaPath: "#/$defs/RunOutcome/properties/selected_tokens/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err11];
                  } else {
                    vErrors.push(err11);
                  }
                  errors++;
                }
                if (typeof data2 == "number" && isFinite(data2)) {
                  if (data2 < 1 || isNaN(data2)) {
                    const err12 = { instancePath: instancePath + "/outcome/selected_tokens", schemaPath: "#/$defs/RunOutcome/properties/selected_tokens/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                    if (vErrors === null) {
                      vErrors = [err12];
                    } else {
                      vErrors.push(err12);
                    }
                    errors++;
                  }
                }
              }
              if (data1.delivered_tokens !== void 0) {
                let data3 = data1.delivered_tokens;
                if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                  const err13 = { instancePath: instancePath + "/outcome/delivered_tokens", schemaPath: "#/$defs/RunOutcome/properties/delivered_tokens/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err13];
                  } else {
                    vErrors.push(err13);
                  }
                  errors++;
                }
                if (typeof data3 == "number" && isFinite(data3)) {
                  if (data3 < 0 || isNaN(data3)) {
                    const err14 = { instancePath: instancePath + "/outcome/delivered_tokens", schemaPath: "#/$defs/RunOutcome/properties/delivered_tokens/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                    if (vErrors === null) {
                      vErrors = [err14];
                    } else {
                      vErrors.push(err14);
                    }
                    errors++;
                  }
                }
              }
              if (data1.unused_budget !== void 0) {
                let data4 = data1.unused_budget;
                if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
                  const err15 = { instancePath: instancePath + "/outcome/unused_budget", schemaPath: "#/$defs/RunOutcome/properties/unused_budget/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err15];
                  } else {
                    vErrors.push(err15);
                  }
                  errors++;
                }
                if (typeof data4 == "number" && isFinite(data4)) {
                  if (data4 < 0 || isNaN(data4)) {
                    const err16 = { instancePath: instancePath + "/outcome/unused_budget", schemaPath: "#/$defs/RunOutcome/properties/unused_budget/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                    if (vErrors === null) {
                      vErrors = [err16];
                    } else {
                      vErrors.push(err16);
                    }
                    errors++;
                  }
                }
              }
              if (data1.stop_reason !== void 0) {
                let data5 = data1.stop_reason;
                if (typeof data5 !== "string") {
                  const err17 = { instancePath: instancePath + "/outcome/stop_reason", schemaPath: "#/$defs/RunOutcome/properties/stop_reason/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                }
                if (!(data5 === "turn_end" || data5 === "output_budget")) {
                  const err18 = { instancePath: instancePath + "/outcome/stop_reason", schemaPath: "#/$defs/RunOutcome/properties/stop_reason/enum", keyword: "enum", params: { allowedValues: schema39.properties.stop_reason.enum }, message: "must be equal to one of the allowed values" };
                  if (vErrors === null) {
                    vErrors = [err18];
                  } else {
                    vErrors.push(err18);
                  }
                  errors++;
                }
              }
              if (data1.complete !== void 0) {
                if (typeof data1.complete !== "boolean") {
                  const err19 = { instancePath: instancePath + "/outcome/complete", schemaPath: "#/$defs/RunOutcome/properties/complete/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
                  if (vErrors === null) {
                    vErrors = [err19];
                  } else {
                    vErrors.push(err19);
                  }
                  errors++;
                }
              }
            } else {
              const err20 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
          }
        } else {
          const err21 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err21];
          } else {
            vErrors.push(err21);
          }
          errors++;
        }
        validate45.errors = vErrors;
        return errors === 0;
      }
      validate45.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.RunEvent = validate46;
      function validate46(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate46.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.event_id === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "event_id" }, message: "must have required property 'event_id'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.run_id === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "run_id" }, message: "must have required property 'run_id'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.request_id === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "request_id" }, message: "must have required property 'request_id'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          if (data.sequence === void 0) {
            const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "sequence" }, message: "must have required property 'sequence'" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
          if (data.causes === void 0) {
            const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "causes" }, message: "must have required property 'causes'" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
          if (data.payload === void 0) {
            const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "payload" }, message: "must have required property 'payload'" };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "event_id" || key0 === "run_id" || key0 === "request_id" || key0 === "sequence" || key0 === "causes" || key0 === "payload")) {
              const err6 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
          }
          if (data.event_id !== void 0) {
            if (typeof data.event_id !== "string") {
              const err7 = { instancePath: instancePath + "/event_id", schemaPath: "#/properties/event_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
          if (data.run_id !== void 0) {
            let data1 = data.run_id;
            if (typeof data1 === "string") {
              if (!pattern4.test(data1)) {
                const err8 = { instancePath: instancePath + "/run_id", schemaPath: "#/properties/run_id/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{64}$" }, message: 'must match pattern "^[0-9a-f]{64}$"' };
                if (vErrors === null) {
                  vErrors = [err8];
                } else {
                  vErrors.push(err8);
                }
                errors++;
              }
            } else {
              const err9 = { instancePath: instancePath + "/run_id", schemaPath: "#/properties/run_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            }
          }
          if (data.request_id !== void 0) {
            if (typeof data.request_id !== "string") {
              const err10 = { instancePath: instancePath + "/request_id", schemaPath: "#/properties/request_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
          }
          if (data.sequence !== void 0) {
            let data3 = data.sequence;
            if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
              const err11 = { instancePath: instancePath + "/sequence", schemaPath: "#/properties/sequence/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
            if (typeof data3 == "number" && isFinite(data3)) {
              if (data3 > 9007199254740991 || isNaN(data3)) {
                const err12 = { instancePath: instancePath + "/sequence", schemaPath: "#/properties/sequence/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err12];
                } else {
                  vErrors.push(err12);
                }
                errors++;
              }
              if (data3 < 0 || isNaN(data3)) {
                const err13 = { instancePath: instancePath + "/sequence", schemaPath: "#/properties/sequence/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err13];
                } else {
                  vErrors.push(err13);
                }
                errors++;
              }
            }
          }
          if (data.causes !== void 0) {
            let data4 = data.causes;
            if (Array.isArray(data4)) {
              const len0 = data4.length;
              for (let i0 = 0; i0 < len0; i0++) {
                if (typeof data4[i0] !== "string") {
                  const err14 = { instancePath: instancePath + "/causes/" + i0, schemaPath: "#/properties/causes/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err14];
                  } else {
                    vErrors.push(err14);
                  }
                  errors++;
                }
              }
              let i1 = data4.length;
              let j0;
              if (i1 > 1) {
                const indices0 = {};
                for (; i1--; ) {
                  let item0 = data4[i1];
                  if (typeof item0 !== "string") {
                    continue;
                  }
                  if (typeof indices0[item0] == "number") {
                    j0 = indices0[item0];
                    const err15 = { instancePath: instancePath + "/causes", schemaPath: "#/properties/causes/uniqueItems", keyword: "uniqueItems", params: { i: i1, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i1 + " are identical)" };
                    if (vErrors === null) {
                      vErrors = [err15];
                    } else {
                      vErrors.push(err15);
                    }
                    errors++;
                    break;
                  }
                  indices0[item0] = i1;
                }
              }
            } else {
              const err16 = { instancePath: instancePath + "/causes", schemaPath: "#/properties/causes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
          }
          if (data.payload !== void 0) {
            let data6 = data.payload;
            const _errs15 = errors;
            let valid4 = false;
            let passing0 = null;
            const _errs16 = errors;
            if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
              if (data6.kind === void 0) {
                const err17 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/RequestArrived/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                if (vErrors === null) {
                  vErrors = [err17];
                } else {
                  vErrors.push(err17);
                }
                errors++;
              }
              if (data6.arrival_us === void 0) {
                const err18 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/RequestArrived/required", keyword: "required", params: { missingProperty: "arrival_us" }, message: "must have required property 'arrival_us'" };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
              for (const key1 in data6) {
                if (!(key1 === "kind" || key1 === "arrival_us")) {
                  const err19 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/RequestArrived/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err19];
                  } else {
                    vErrors.push(err19);
                  }
                  errors++;
                }
              }
              if (data6.kind !== void 0) {
                let data7 = data6.kind;
                if (typeof data7 !== "string") {
                  const err20 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/RequestArrived/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err20];
                  } else {
                    vErrors.push(err20);
                  }
                  errors++;
                }
                if ("request-arrived" !== data7) {
                  const err21 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/RequestArrived/properties/kind/const", keyword: "const", params: { allowedValue: "request-arrived" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err21];
                  } else {
                    vErrors.push(err21);
                  }
                  errors++;
                }
              }
              if (data6.arrival_us !== void 0) {
                let data8 = data6.arrival_us;
                if (!(typeof data8 == "number" && (!(data8 % 1) && !isNaN(data8)) && isFinite(data8))) {
                  const err22 = { instancePath: instancePath + "/payload/arrival_us", schemaPath: "#/$defs/RequestArrived/properties/arrival_us/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err22];
                  } else {
                    vErrors.push(err22);
                  }
                  errors++;
                }
                if (typeof data8 == "number" && isFinite(data8)) {
                  if (data8 > 9007199254740991 || isNaN(data8)) {
                    const err23 = { instancePath: instancePath + "/payload/arrival_us", schemaPath: "#/$defs/RequestArrived/properties/arrival_us/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                    if (vErrors === null) {
                      vErrors = [err23];
                    } else {
                      vErrors.push(err23);
                    }
                    errors++;
                  }
                  if (data8 < 0 || isNaN(data8)) {
                    const err24 = { instancePath: instancePath + "/payload/arrival_us", schemaPath: "#/$defs/RequestArrived/properties/arrival_us/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                    if (vErrors === null) {
                      vErrors = [err24];
                    } else {
                      vErrors.push(err24);
                    }
                    errors++;
                  }
                }
              }
            } else {
              const err25 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/RequestArrived/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err25];
              } else {
                vErrors.push(err25);
              }
              errors++;
            }
            var _valid0 = _errs16 === errors;
            if (_valid0) {
              valid4 = true;
              passing0 = 0;
              var props0 = true;
            }
            const _errs24 = errors;
            if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
              if (data6.kind === void 0) {
                const err26 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/InputEncoded/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                if (vErrors === null) {
                  vErrors = [err26];
                } else {
                  vErrors.push(err26);
                }
                errors++;
              }
              if (data6.input_sha256 === void 0) {
                const err27 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/InputEncoded/required", keyword: "required", params: { missingProperty: "input_sha256" }, message: "must have required property 'input_sha256'" };
                if (vErrors === null) {
                  vErrors = [err27];
                } else {
                  vErrors.push(err27);
                }
                errors++;
              }
              if (data6.token_count === void 0) {
                const err28 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/InputEncoded/required", keyword: "required", params: { missingProperty: "token_count" }, message: "must have required property 'token_count'" };
                if (vErrors === null) {
                  vErrors = [err28];
                } else {
                  vErrors.push(err28);
                }
                errors++;
              }
              for (const key2 in data6) {
                if (!(key2 === "kind" || key2 === "input_sha256" || key2 === "token_count")) {
                  const err29 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/InputEncoded/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err29];
                  } else {
                    vErrors.push(err29);
                  }
                  errors++;
                }
              }
              if (data6.kind !== void 0) {
                let data9 = data6.kind;
                if (typeof data9 !== "string") {
                  const err30 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/InputEncoded/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err30];
                  } else {
                    vErrors.push(err30);
                  }
                  errors++;
                }
                if ("input-encoded" !== data9) {
                  const err31 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/InputEncoded/properties/kind/const", keyword: "const", params: { allowedValue: "input-encoded" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err31];
                  } else {
                    vErrors.push(err31);
                  }
                  errors++;
                }
              }
              if (data6.input_sha256 !== void 0) {
                let data10 = data6.input_sha256;
                if (typeof data10 === "string") {
                  if (!pattern4.test(data10)) {
                    const err32 = { instancePath: instancePath + "/payload/input_sha256", schemaPath: "#/$defs/InputEncoded/properties/input_sha256/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{64}$" }, message: 'must match pattern "^[0-9a-f]{64}$"' };
                    if (vErrors === null) {
                      vErrors = [err32];
                    } else {
                      vErrors.push(err32);
                    }
                    errors++;
                  }
                } else {
                  const err33 = { instancePath: instancePath + "/payload/input_sha256", schemaPath: "#/$defs/InputEncoded/properties/input_sha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err33];
                  } else {
                    vErrors.push(err33);
                  }
                  errors++;
                }
              }
              if (data6.token_count !== void 0) {
                let data11 = data6.token_count;
                if (!(typeof data11 == "number" && (!(data11 % 1) && !isNaN(data11)) && isFinite(data11))) {
                  const err34 = { instancePath: instancePath + "/payload/token_count", schemaPath: "#/$defs/InputEncoded/properties/token_count/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err34];
                  } else {
                    vErrors.push(err34);
                  }
                  errors++;
                }
                if (typeof data11 == "number" && isFinite(data11)) {
                  if (data11 > 9007199254740991 || isNaN(data11)) {
                    const err35 = { instancePath: instancePath + "/payload/token_count", schemaPath: "#/$defs/InputEncoded/properties/token_count/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                    if (vErrors === null) {
                      vErrors = [err35];
                    } else {
                      vErrors.push(err35);
                    }
                    errors++;
                  }
                  if (data11 < 0 || isNaN(data11)) {
                    const err36 = { instancePath: instancePath + "/payload/token_count", schemaPath: "#/$defs/InputEncoded/properties/token_count/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                    if (vErrors === null) {
                      vErrors = [err36];
                    } else {
                      vErrors.push(err36);
                    }
                    errors++;
                  }
                }
              }
            } else {
              const err37 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/InputEncoded/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err37];
              } else {
                vErrors.push(err37);
              }
              errors++;
            }
            var _valid0 = _errs24 === errors;
            if (_valid0 && valid4) {
              valid4 = false;
              passing0 = [passing0, 1];
            } else {
              if (_valid0) {
                valid4 = true;
                passing0 = 1;
                if (props0 !== true) {
                  props0 = true;
                }
              }
              const _errs34 = errors;
              if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
                if (data6.kind === void 0) {
                  const err38 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/WorkCompleted/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                  if (vErrors === null) {
                    vErrors = [err38];
                  } else {
                    vErrors.push(err38);
                  }
                  errors++;
                }
                if (data6.work_id === void 0) {
                  const err39 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/WorkCompleted/required", keyword: "required", params: { missingProperty: "work_id" }, message: "must have required property 'work_id'" };
                  if (vErrors === null) {
                    vErrors = [err39];
                  } else {
                    vErrors.push(err39);
                  }
                  errors++;
                }
                if (data6.phase === void 0) {
                  const err40 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/WorkCompleted/required", keyword: "required", params: { missingProperty: "phase" }, message: "must have required property 'phase'" };
                  if (vErrors === null) {
                    vErrors = [err40];
                  } else {
                    vErrors.push(err40);
                  }
                  errors++;
                }
                for (const key3 in data6) {
                  if (!(key3 === "kind" || key3 === "work_id" || key3 === "phase")) {
                    const err41 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/WorkCompleted/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key3 }, message: "must NOT have additional properties" };
                    if (vErrors === null) {
                      vErrors = [err41];
                    } else {
                      vErrors.push(err41);
                    }
                    errors++;
                  }
                }
                if (data6.kind !== void 0) {
                  let data12 = data6.kind;
                  if (typeof data12 !== "string") {
                    const err42 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/WorkCompleted/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                    if (vErrors === null) {
                      vErrors = [err42];
                    } else {
                      vErrors.push(err42);
                    }
                    errors++;
                  }
                  if ("work-completed" !== data12) {
                    const err43 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/WorkCompleted/properties/kind/const", keyword: "const", params: { allowedValue: "work-completed" }, message: "must be equal to constant" };
                    if (vErrors === null) {
                      vErrors = [err43];
                    } else {
                      vErrors.push(err43);
                    }
                    errors++;
                  }
                }
                if (data6.work_id !== void 0) {
                  if (typeof data6.work_id !== "string") {
                    const err44 = { instancePath: instancePath + "/payload/work_id", schemaPath: "#/$defs/WorkCompleted/properties/work_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                    if (vErrors === null) {
                      vErrors = [err44];
                    } else {
                      vErrors.push(err44);
                    }
                    errors++;
                  }
                }
                if (data6.phase !== void 0) {
                  let data14 = data6.phase;
                  if (typeof data14 !== "string") {
                    const err45 = { instancePath: instancePath + "/payload/phase", schemaPath: "#/$defs/WorkCompleted/properties/phase/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                    if (vErrors === null) {
                      vErrors = [err45];
                    } else {
                      vErrors.push(err45);
                    }
                    errors++;
                  }
                  if (!(data14 === "prefill" || data14 === "decode")) {
                    const err46 = { instancePath: instancePath + "/payload/phase", schemaPath: "#/$defs/WorkCompleted/properties/phase/enum", keyword: "enum", params: { allowedValues: schema50.properties.phase.enum }, message: "must be equal to one of the allowed values" };
                    if (vErrors === null) {
                      vErrors = [err46];
                    } else {
                      vErrors.push(err46);
                    }
                    errors++;
                  }
                }
              } else {
                const err47 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/WorkCompleted/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                if (vErrors === null) {
                  vErrors = [err47];
                } else {
                  vErrors.push(err47);
                }
                errors++;
              }
              var _valid0 = _errs34 === errors;
              if (_valid0 && valid4) {
                valid4 = false;
                passing0 = [passing0, 2];
              } else {
                if (_valid0) {
                  valid4 = true;
                  passing0 = 2;
                  if (props0 !== true) {
                    props0 = true;
                  }
                }
                const _errs44 = errors;
                if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
                  if (data6.kind === void 0) {
                    const err48 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenSelected/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                    if (vErrors === null) {
                      vErrors = [err48];
                    } else {
                      vErrors.push(err48);
                    }
                    errors++;
                  }
                  if (data6.work_id === void 0) {
                    const err49 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenSelected/required", keyword: "required", params: { missingProperty: "work_id" }, message: "must have required property 'work_id'" };
                    if (vErrors === null) {
                      vErrors = [err49];
                    } else {
                      vErrors.push(err49);
                    }
                    errors++;
                  }
                  if (data6.token_id === void 0) {
                    const err50 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenSelected/required", keyword: "required", params: { missingProperty: "token_id" }, message: "must have required property 'token_id'" };
                    if (vErrors === null) {
                      vErrors = [err50];
                    } else {
                      vErrors.push(err50);
                    }
                    errors++;
                  }
                  if (data6.output_position === void 0) {
                    const err51 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenSelected/required", keyword: "required", params: { missingProperty: "output_position" }, message: "must have required property 'output_position'" };
                    if (vErrors === null) {
                      vErrors = [err51];
                    } else {
                      vErrors.push(err51);
                    }
                    errors++;
                  }
                  for (const key4 in data6) {
                    if (!(key4 === "kind" || key4 === "work_id" || key4 === "token_id" || key4 === "output_position")) {
                      const err52 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenSelected/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key4 }, message: "must NOT have additional properties" };
                      if (vErrors === null) {
                        vErrors = [err52];
                      } else {
                        vErrors.push(err52);
                      }
                      errors++;
                    }
                  }
                  if (data6.kind !== void 0) {
                    let data15 = data6.kind;
                    if (typeof data15 !== "string") {
                      const err53 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/TokenSelected/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err53];
                      } else {
                        vErrors.push(err53);
                      }
                      errors++;
                    }
                    if ("token-selected" !== data15) {
                      const err54 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/TokenSelected/properties/kind/const", keyword: "const", params: { allowedValue: "token-selected" }, message: "must be equal to constant" };
                      if (vErrors === null) {
                        vErrors = [err54];
                      } else {
                        vErrors.push(err54);
                      }
                      errors++;
                    }
                  }
                  if (data6.work_id !== void 0) {
                    if (typeof data6.work_id !== "string") {
                      const err55 = { instancePath: instancePath + "/payload/work_id", schemaPath: "#/$defs/TokenSelected/properties/work_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err55];
                      } else {
                        vErrors.push(err55);
                      }
                      errors++;
                    }
                  }
                  if (data6.token_id !== void 0) {
                    let data17 = data6.token_id;
                    if (!(typeof data17 == "number" && (!(data17 % 1) && !isNaN(data17)) && isFinite(data17))) {
                      const err56 = { instancePath: instancePath + "/payload/token_id", schemaPath: "#/$defs/TokenSelected/properties/token_id/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err56];
                      } else {
                        vErrors.push(err56);
                      }
                      errors++;
                    }
                    if (typeof data17 == "number" && isFinite(data17)) {
                      if (data17 > 9007199254740991 || isNaN(data17)) {
                        const err57 = { instancePath: instancePath + "/payload/token_id", schemaPath: "#/$defs/TokenSelected/properties/token_id/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                        if (vErrors === null) {
                          vErrors = [err57];
                        } else {
                          vErrors.push(err57);
                        }
                        errors++;
                      }
                      if (data17 < 0 || isNaN(data17)) {
                        const err58 = { instancePath: instancePath + "/payload/token_id", schemaPath: "#/$defs/TokenSelected/properties/token_id/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                        if (vErrors === null) {
                          vErrors = [err58];
                        } else {
                          vErrors.push(err58);
                        }
                        errors++;
                      }
                    }
                  }
                  if (data6.output_position !== void 0) {
                    let data18 = data6.output_position;
                    if (!(typeof data18 == "number" && (!(data18 % 1) && !isNaN(data18)) && isFinite(data18))) {
                      const err59 = { instancePath: instancePath + "/payload/output_position", schemaPath: "#/$defs/TokenSelected/properties/output_position/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err59];
                      } else {
                        vErrors.push(err59);
                      }
                      errors++;
                    }
                    if (typeof data18 == "number" && isFinite(data18)) {
                      if (data18 > 9007199254740991 || isNaN(data18)) {
                        const err60 = { instancePath: instancePath + "/payload/output_position", schemaPath: "#/$defs/TokenSelected/properties/output_position/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                        if (vErrors === null) {
                          vErrors = [err60];
                        } else {
                          vErrors.push(err60);
                        }
                        errors++;
                      }
                      if (data18 < 0 || isNaN(data18)) {
                        const err61 = { instancePath: instancePath + "/payload/output_position", schemaPath: "#/$defs/TokenSelected/properties/output_position/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                        if (vErrors === null) {
                          vErrors = [err61];
                        } else {
                          vErrors.push(err61);
                        }
                        errors++;
                      }
                    }
                  }
                } else {
                  const err62 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenSelected/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                  if (vErrors === null) {
                    vErrors = [err62];
                  } else {
                    vErrors.push(err62);
                  }
                  errors++;
                }
                var _valid0 = _errs44 === errors;
                if (_valid0 && valid4) {
                  valid4 = false;
                  passing0 = [passing0, 3];
                } else {
                  if (_valid0) {
                    valid4 = true;
                    passing0 = 3;
                    if (props0 !== true) {
                      props0 = true;
                    }
                  }
                  const _errs56 = errors;
                  if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
                    if (data6.kind === void 0) {
                      const err63 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenCommitted/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                      if (vErrors === null) {
                        vErrors = [err63];
                      } else {
                        vErrors.push(err63);
                      }
                      errors++;
                    }
                    if (data6.work_id === void 0) {
                      const err64 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenCommitted/required", keyword: "required", params: { missingProperty: "work_id" }, message: "must have required property 'work_id'" };
                      if (vErrors === null) {
                        vErrors = [err64];
                      } else {
                        vErrors.push(err64);
                      }
                      errors++;
                    }
                    if (data6.token_ids === void 0) {
                      const err65 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenCommitted/required", keyword: "required", params: { missingProperty: "token_ids" }, message: "must have required property 'token_ids'" };
                      if (vErrors === null) {
                        vErrors = [err65];
                      } else {
                        vErrors.push(err65);
                      }
                      errors++;
                    }
                    if (data6.output_start === void 0) {
                      const err66 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenCommitted/required", keyword: "required", params: { missingProperty: "output_start" }, message: "must have required property 'output_start'" };
                      if (vErrors === null) {
                        vErrors = [err66];
                      } else {
                        vErrors.push(err66);
                      }
                      errors++;
                    }
                    for (const key5 in data6) {
                      if (!(key5 === "kind" || key5 === "work_id" || key5 === "token_ids" || key5 === "output_start")) {
                        const err67 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenCommitted/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key5 }, message: "must NOT have additional properties" };
                        if (vErrors === null) {
                          vErrors = [err67];
                        } else {
                          vErrors.push(err67);
                        }
                        errors++;
                      }
                    }
                    if (data6.kind !== void 0) {
                      let data19 = data6.kind;
                      if (typeof data19 !== "string") {
                        const err68 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/TokenCommitted/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                        if (vErrors === null) {
                          vErrors = [err68];
                        } else {
                          vErrors.push(err68);
                        }
                        errors++;
                      }
                      if ("token-committed" !== data19) {
                        const err69 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/TokenCommitted/properties/kind/const", keyword: "const", params: { allowedValue: "token-committed" }, message: "must be equal to constant" };
                        if (vErrors === null) {
                          vErrors = [err69];
                        } else {
                          vErrors.push(err69);
                        }
                        errors++;
                      }
                    }
                    if (data6.work_id !== void 0) {
                      if (typeof data6.work_id !== "string") {
                        const err70 = { instancePath: instancePath + "/payload/work_id", schemaPath: "#/$defs/TokenCommitted/properties/work_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                        if (vErrors === null) {
                          vErrors = [err70];
                        } else {
                          vErrors.push(err70);
                        }
                        errors++;
                      }
                    }
                    if (data6.token_ids !== void 0) {
                      let data21 = data6.token_ids;
                      if (Array.isArray(data21)) {
                        if (data21.length < 1) {
                          const err71 = { instancePath: instancePath + "/payload/token_ids", schemaPath: "#/$defs/TokenCommitted/properties/token_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                          if (vErrors === null) {
                            vErrors = [err71];
                          } else {
                            vErrors.push(err71);
                          }
                          errors++;
                        }
                        const len1 = data21.length;
                        for (let i2 = 0; i2 < len1; i2++) {
                          let data22 = data21[i2];
                          if (!(typeof data22 == "number" && (!(data22 % 1) && !isNaN(data22)) && isFinite(data22))) {
                            const err72 = { instancePath: instancePath + "/payload/token_ids/" + i2, schemaPath: "#/$defs/TokenCommitted/properties/token_ids/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                            if (vErrors === null) {
                              vErrors = [err72];
                            } else {
                              vErrors.push(err72);
                            }
                            errors++;
                          }
                          if (typeof data22 == "number" && isFinite(data22)) {
                            if (data22 > 9007199254740991 || isNaN(data22)) {
                              const err73 = { instancePath: instancePath + "/payload/token_ids/" + i2, schemaPath: "#/$defs/TokenCommitted/properties/token_ids/items/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                              if (vErrors === null) {
                                vErrors = [err73];
                              } else {
                                vErrors.push(err73);
                              }
                              errors++;
                            }
                            if (data22 < 0 || isNaN(data22)) {
                              const err74 = { instancePath: instancePath + "/payload/token_ids/" + i2, schemaPath: "#/$defs/TokenCommitted/properties/token_ids/items/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                              if (vErrors === null) {
                                vErrors = [err74];
                              } else {
                                vErrors.push(err74);
                              }
                              errors++;
                            }
                          }
                        }
                      } else {
                        const err75 = { instancePath: instancePath + "/payload/token_ids", schemaPath: "#/$defs/TokenCommitted/properties/token_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                        if (vErrors === null) {
                          vErrors = [err75];
                        } else {
                          vErrors.push(err75);
                        }
                        errors++;
                      }
                    }
                    if (data6.output_start !== void 0) {
                      let data23 = data6.output_start;
                      if (!(typeof data23 == "number" && (!(data23 % 1) && !isNaN(data23)) && isFinite(data23))) {
                        const err76 = { instancePath: instancePath + "/payload/output_start", schemaPath: "#/$defs/TokenCommitted/properties/output_start/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                        if (vErrors === null) {
                          vErrors = [err76];
                        } else {
                          vErrors.push(err76);
                        }
                        errors++;
                      }
                      if (typeof data23 == "number" && isFinite(data23)) {
                        if (data23 > 9007199254740991 || isNaN(data23)) {
                          const err77 = { instancePath: instancePath + "/payload/output_start", schemaPath: "#/$defs/TokenCommitted/properties/output_start/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                          if (vErrors === null) {
                            vErrors = [err77];
                          } else {
                            vErrors.push(err77);
                          }
                          errors++;
                        }
                        if (data23 < 0 || isNaN(data23)) {
                          const err78 = { instancePath: instancePath + "/payload/output_start", schemaPath: "#/$defs/TokenCommitted/properties/output_start/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                          if (vErrors === null) {
                            vErrors = [err78];
                          } else {
                            vErrors.push(err78);
                          }
                          errors++;
                        }
                      }
                    }
                  } else {
                    const err79 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenCommitted/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                    if (vErrors === null) {
                      vErrors = [err79];
                    } else {
                      vErrors.push(err79);
                    }
                    errors++;
                  }
                  var _valid0 = _errs56 === errors;
                  if (_valid0 && valid4) {
                    valid4 = false;
                    passing0 = [passing0, 4];
                  } else {
                    if (_valid0) {
                      valid4 = true;
                      passing0 = 4;
                      if (props0 !== true) {
                        props0 = true;
                      }
                    }
                    const _errs70 = errors;
                    if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
                      if (data6.kind === void 0) {
                        const err80 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenDelivered/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                        if (vErrors === null) {
                          vErrors = [err80];
                        } else {
                          vErrors.push(err80);
                        }
                        errors++;
                      }
                      if (data6.work_id === void 0) {
                        const err81 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenDelivered/required", keyword: "required", params: { missingProperty: "work_id" }, message: "must have required property 'work_id'" };
                        if (vErrors === null) {
                          vErrors = [err81];
                        } else {
                          vErrors.push(err81);
                        }
                        errors++;
                      }
                      if (data6.token_ids === void 0) {
                        const err82 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenDelivered/required", keyword: "required", params: { missingProperty: "token_ids" }, message: "must have required property 'token_ids'" };
                        if (vErrors === null) {
                          vErrors = [err82];
                        } else {
                          vErrors.push(err82);
                        }
                        errors++;
                      }
                      if (data6.output_start === void 0) {
                        const err83 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenDelivered/required", keyword: "required", params: { missingProperty: "output_start" }, message: "must have required property 'output_start'" };
                        if (vErrors === null) {
                          vErrors = [err83];
                        } else {
                          vErrors.push(err83);
                        }
                        errors++;
                      }
                      if (data6.display_delta === void 0) {
                        const err84 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenDelivered/required", keyword: "required", params: { missingProperty: "display_delta" }, message: "must have required property 'display_delta'" };
                        if (vErrors === null) {
                          vErrors = [err84];
                        } else {
                          vErrors.push(err84);
                        }
                        errors++;
                      }
                      for (const key6 in data6) {
                        if (!(key6 === "kind" || key6 === "work_id" || key6 === "token_ids" || key6 === "output_start" || key6 === "display_delta")) {
                          const err85 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenDelivered/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key6 }, message: "must NOT have additional properties" };
                          if (vErrors === null) {
                            vErrors = [err85];
                          } else {
                            vErrors.push(err85);
                          }
                          errors++;
                        }
                      }
                      if (data6.kind !== void 0) {
                        let data24 = data6.kind;
                        if (typeof data24 !== "string") {
                          const err86 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/TokenDelivered/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                          if (vErrors === null) {
                            vErrors = [err86];
                          } else {
                            vErrors.push(err86);
                          }
                          errors++;
                        }
                        if ("token-delivered" !== data24) {
                          const err87 = { instancePath: instancePath + "/payload/kind", schemaPath: "#/$defs/TokenDelivered/properties/kind/const", keyword: "const", params: { allowedValue: "token-delivered" }, message: "must be equal to constant" };
                          if (vErrors === null) {
                            vErrors = [err87];
                          } else {
                            vErrors.push(err87);
                          }
                          errors++;
                        }
                      }
                      if (data6.work_id !== void 0) {
                        if (typeof data6.work_id !== "string") {
                          const err88 = { instancePath: instancePath + "/payload/work_id", schemaPath: "#/$defs/TokenDelivered/properties/work_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                          if (vErrors === null) {
                            vErrors = [err88];
                          } else {
                            vErrors.push(err88);
                          }
                          errors++;
                        }
                      }
                      if (data6.token_ids !== void 0) {
                        let data26 = data6.token_ids;
                        if (Array.isArray(data26)) {
                          if (data26.length < 1) {
                            const err89 = { instancePath: instancePath + "/payload/token_ids", schemaPath: "#/$defs/TokenDelivered/properties/token_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                            if (vErrors === null) {
                              vErrors = [err89];
                            } else {
                              vErrors.push(err89);
                            }
                            errors++;
                          }
                          const len2 = data26.length;
                          for (let i3 = 0; i3 < len2; i3++) {
                            let data27 = data26[i3];
                            if (!(typeof data27 == "number" && (!(data27 % 1) && !isNaN(data27)) && isFinite(data27))) {
                              const err90 = { instancePath: instancePath + "/payload/token_ids/" + i3, schemaPath: "#/$defs/TokenDelivered/properties/token_ids/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                              if (vErrors === null) {
                                vErrors = [err90];
                              } else {
                                vErrors.push(err90);
                              }
                              errors++;
                            }
                            if (typeof data27 == "number" && isFinite(data27)) {
                              if (data27 > 9007199254740991 || isNaN(data27)) {
                                const err91 = { instancePath: instancePath + "/payload/token_ids/" + i3, schemaPath: "#/$defs/TokenDelivered/properties/token_ids/items/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                                if (vErrors === null) {
                                  vErrors = [err91];
                                } else {
                                  vErrors.push(err91);
                                }
                                errors++;
                              }
                              if (data27 < 0 || isNaN(data27)) {
                                const err92 = { instancePath: instancePath + "/payload/token_ids/" + i3, schemaPath: "#/$defs/TokenDelivered/properties/token_ids/items/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                                if (vErrors === null) {
                                  vErrors = [err92];
                                } else {
                                  vErrors.push(err92);
                                }
                                errors++;
                              }
                            }
                          }
                        } else {
                          const err93 = { instancePath: instancePath + "/payload/token_ids", schemaPath: "#/$defs/TokenDelivered/properties/token_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err93];
                          } else {
                            vErrors.push(err93);
                          }
                          errors++;
                        }
                      }
                      if (data6.output_start !== void 0) {
                        let data28 = data6.output_start;
                        if (!(typeof data28 == "number" && (!(data28 % 1) && !isNaN(data28)) && isFinite(data28))) {
                          const err94 = { instancePath: instancePath + "/payload/output_start", schemaPath: "#/$defs/TokenDelivered/properties/output_start/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                          if (vErrors === null) {
                            vErrors = [err94];
                          } else {
                            vErrors.push(err94);
                          }
                          errors++;
                        }
                        if (typeof data28 == "number" && isFinite(data28)) {
                          if (data28 > 9007199254740991 || isNaN(data28)) {
                            const err95 = { instancePath: instancePath + "/payload/output_start", schemaPath: "#/$defs/TokenDelivered/properties/output_start/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                            if (vErrors === null) {
                              vErrors = [err95];
                            } else {
                              vErrors.push(err95);
                            }
                            errors++;
                          }
                          if (data28 < 0 || isNaN(data28)) {
                            const err96 = { instancePath: instancePath + "/payload/output_start", schemaPath: "#/$defs/TokenDelivered/properties/output_start/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                            if (vErrors === null) {
                              vErrors = [err96];
                            } else {
                              vErrors.push(err96);
                            }
                            errors++;
                          }
                        }
                      }
                      if (data6.display_delta !== void 0) {
                        if (typeof data6.display_delta !== "string") {
                          const err97 = { instancePath: instancePath + "/payload/display_delta", schemaPath: "#/$defs/TokenDelivered/properties/display_delta/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                          if (vErrors === null) {
                            vErrors = [err97];
                          } else {
                            vErrors.push(err97);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err98 = { instancePath: instancePath + "/payload", schemaPath: "#/$defs/TokenDelivered/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                      if (vErrors === null) {
                        vErrors = [err98];
                      } else {
                        vErrors.push(err98);
                      }
                      errors++;
                    }
                    var _valid0 = _errs70 === errors;
                    if (_valid0 && valid4) {
                      valid4 = false;
                      passing0 = [passing0, 5];
                    } else {
                      if (_valid0) {
                        valid4 = true;
                        passing0 = 5;
                        if (props0 !== true) {
                          props0 = true;
                        }
                      }
                      const _errs86 = errors;
                      if (!validate45(data6, { instancePath: instancePath + "/payload", parentData: data, parentDataProperty: "payload", rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate45.errors : vErrors.concat(validate45.errors);
                        errors = vErrors.length;
                      }
                      var _valid0 = _errs86 === errors;
                      if (_valid0 && valid4) {
                        valid4 = false;
                        passing0 = [passing0, 6];
                      } else {
                        if (_valid0) {
                          valid4 = true;
                          passing0 = 6;
                          if (props0 !== true) {
                            props0 = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            if (!valid4) {
              const err99 = { instancePath: instancePath + "/payload", schemaPath: "#/properties/payload/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
              if (vErrors === null) {
                vErrors = [err99];
              } else {
                vErrors.push(err99);
              }
              errors++;
            } else {
              errors = _errs15;
              if (vErrors !== null) {
                if (_errs15) {
                  vErrors.length = _errs15;
                } else {
                  vErrors = null;
                }
              }
            }
          }
        } else {
          const err100 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err100];
          } else {
            vErrors.push(err100);
          }
          errors++;
        }
        validate46.errors = vErrors;
        return errors === 0;
      }
      validate46.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.NumericalTrace = validate48;
      var schema63 = { "type": "object", "properties": { "checkpoint": { "type": "object", "properties": { "config": { "$ref": "#/$defs/ModelArchitecture" }, "format": { "type": "string" }, "manifest_sha256": { "type": "string" }, "parameters": { "type": "object", "properties": { "attention_output": { "type": "array", "items": { "type": "array", "items": { "type": "number" } } }, "attention_output_bias": { "type": "array", "items": { "type": "number" } }, "ff_down": { "type": "array", "items": { "type": "array", "items": { "type": "number" } } }, "ff_down_bias": { "type": "array", "items": { "type": "number" } }, "ff_up": { "type": "array", "items": { "type": "array", "items": { "type": "number" } } }, "ff_up_bias": { "type": "array", "items": { "type": "number" } }, "key": { "type": "array", "items": { "type": "array", "items": { "type": "number" } } }, "key_bias": { "type": "array", "items": { "type": "number" } }, "lm_bias": { "type": "array", "items": { "type": "number" } }, "lm_head": { "type": "array", "items": { "type": "array", "items": { "type": "number" } } }, "ln1_bias": { "type": "array", "items": { "type": "number" } }, "ln1_scale": { "type": "array", "items": { "type": "number" } }, "ln2_bias": { "type": "array", "items": { "type": "number" } }, "ln2_scale": { "type": "array", "items": { "type": "number" } }, "ln_final_bias": { "type": "array", "items": { "type": "number" } }, "ln_final_scale": { "type": "array", "items": { "type": "number" } }, "position_embedding": { "type": "array", "items": { "type": "array", "items": { "type": "number" } } }, "query": { "type": "array", "items": { "type": "array", "items": { "type": "number" } } }, "query_bias": { "type": "array", "items": { "type": "number" } }, "token_embedding": { "type": "array", "items": { "type": "array", "items": { "type": "number" } } }, "value": { "type": "array", "items": { "type": "array", "items": { "type": "number" } } }, "value_bias": { "type": "array", "items": { "type": "number" } } }, "required": ["attention_output", "attention_output_bias", "ff_down", "ff_down_bias", "ff_up", "ff_up_bias", "key", "key_bias", "lm_bias", "lm_head", "ln1_bias", "ln1_scale", "ln2_bias", "ln2_scale", "ln_final_bias", "ln_final_scale", "position_embedding", "query", "query_bias", "token_embedding", "value", "value_bias"], "additionalProperties": false }, "provenance": { "type": "object", "properties": { "initializer": { "type": "string" }, "kind": { "type": "string" }, "seed": { "type": "integer" } }, "required": ["initializer", "kind", "seed"], "additionalProperties": false } }, "required": ["config", "format", "manifest_sha256", "parameters", "provenance"], "additionalProperties": false }, "code": { "type": "object", "properties": { "python": { "type": "string" }, "revision": { "type": "string" }, "source_sha256": { "type": "string" }, "sources": { "type": "object", "additionalProperties": { "type": "string", "pattern": "^[0-9a-f]{64}$" } } }, "required": ["python", "revision", "source_sha256", "sources"], "additionalProperties": false }, "contract_sha256": { "type": "string" }, "declaration": { "$ref": "#/$defs/RequestBinding" }, "decoding_contract": { "type": "object", "properties": { "choice": { "type": "string" }, "explanation": { "type": "string" }, "rule": { "type": "string" } }, "required": ["choice", "explanation", "rule"], "additionalProperties": false }, "evidence": { "type": "string" }, "format": { "type": "string", "const": "naive-gpt-run-v2" }, "id": { "type": "string" }, "outcome": { "$ref": "#/$defs/RunOutcome" }, "output_ids": { "type": "array", "items": { "type": "integer" } }, "output_display": { "type": "string", "description": "Diagnostic token display; raw IDs are authoritative. Control, byte, and hex IDs appear as labeled markers." }, "passes": { "type": "array", "items": { "type": "object", "properties": { "display_so_far": { "type": "string", "description": "Diagnostic token display; raw IDs are authoritative. Control, byte, and hex IDs appear as labeled markers." }, "execution": { "type": "string" }, "id": { "type": "string" }, "input_ids": { "type": "array", "items": { "type": "integer" } }, "nodes": { "type": "array", "items": { "type": "object", "properties": { "axes": { "type": "array", "items": { "type": "string" } }, "dtype": { "type": "string" }, "formula": { "type": "string" }, "id": { "type": "string" }, "inputs": { "type": "array", "items": { "type": "string" } }, "layer": { "type": ["integer", "null"] }, "name": { "type": "string" }, "positions": { "type": "array", "items": { "type": "integer" } }, "request_id": { "type": "string" }, "run_id": { "type": "string" }, "shape": { "type": "array", "items": { "type": "integer" } }, "step": { "type": "integer" }, "term": { "type": "string" }, "values": { "type": "array", "items": { "anyOf": [{ "type": "number" }, { "type": "boolean" }, { "type": "array", "items": { "type": ["number", "boolean"] } }] } } }, "required": ["axes", "dtype", "formula", "id", "inputs", "layer", "name", "positions", "request_id", "run_id", "shape", "step", "term", "values"], "additionalProperties": false } }, "output_position": { "type": "integer" }, "phase": { "type": "string" }, "positions": { "type": "array", "items": { "type": "integer" } }, "request_id": { "type": "string" }, "run_id": { "type": "string" }, "selection": { "type": "object", "properties": { "decoding": { "type": "string" }, "probabilities": { "type": "array", "items": { "type": "number" } }, "raw_logits": { "type": "array", "items": { "type": "number" } }, "rng_state": { "type": "null" }, "rule": { "type": "string", "const": "unmasked-greedy-v1" }, "selected_id": { "type": "integer" } }, "required": ["decoding", "probabilities", "raw_logits", "rng_state", "rule", "selected_id"], "additionalProperties": false }, "selection_position": { "type": "integer" }, "step": { "type": "integer" } }, "required": ["display_so_far", "execution", "id", "input_ids", "nodes", "output_position", "phase", "positions", "request_id", "run_id", "selection", "selection_position", "step"], "additionalProperties": false } }, "precision": { "type": "object", "properties": { "accumulation": { "type": "string" }, "compute": { "type": "string" }, "storage": { "type": "string" } }, "required": ["accumulation", "compute", "storage"], "additionalProperties": false }, "request_id": { "type": "string" }, "sequence_ids": { "type": "array", "items": { "type": "integer" } }, "tokenizer": { "type": "object", "properties": { "codec_version": { "type": "string" }, "context_limit": { "type": ["integer", "null"] }, "ids": { "type": "array", "items": { "type": "integer" } }, "input_kind": { "type": "string" }, "input_sha256": { "type": "string" }, "manifest_sha256": { "type": "string" }, "spans": { "type": "array", "items": { "type": "object", "properties": { "byte_end": { "type": ["integer", "null"] }, "byte_start": { "type": ["integer", "null"] }, "ids": { "type": "array", "items": { "type": "integer" } }, "kind": { "type": "string" }, "raw_bytes": { "type": "array", "items": { "type": "integer" } }, "reason": { "type": "string" }, "token_end": { "type": "integer" }, "token_start": { "type": "integer" }, "turn": { "type": ["integer", "null"] } }, "required": ["byte_end", "byte_start", "ids", "kind", "raw_bytes", "reason", "token_end", "token_start", "turn"], "additionalProperties": false } }, "unicode_version": { "type": "string" } }, "required": ["codec_version", "context_limit", "ids", "input_kind", "input_sha256", "manifest_sha256", "spans", "unicode_version"], "additionalProperties": false }, "vocabulary": { "type": "array", "items": { "type": "object", "properties": { "group": { "type": "string" }, "id": { "type": "integer" }, "kind": { "type": "string" }, "piece": { "type": "string" } }, "required": ["group", "id", "kind", "piece"], "additionalProperties": false } } }, "required": ["checkpoint", "code", "contract_sha256", "declaration", "decoding_contract", "evidence", "format", "id", "outcome", "output_ids", "output_display", "passes", "precision", "request_id", "sequence_ids", "tokenizer", "vocabulary"], "additionalProperties": false, "x-owner": "NumericalEvidence" };
      function validate48(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate48.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.checkpoint === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "checkpoint" }, message: "must have required property 'checkpoint'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.code === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.contract_sha256 === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "contract_sha256" }, message: "must have required property 'contract_sha256'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          if (data.declaration === void 0) {
            const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "declaration" }, message: "must have required property 'declaration'" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
          if (data.decoding_contract === void 0) {
            const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "decoding_contract" }, message: "must have required property 'decoding_contract'" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
          if (data.evidence === void 0) {
            const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "evidence" }, message: "must have required property 'evidence'" };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
          if (data.format === void 0) {
            const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "format" }, message: "must have required property 'format'" };
            if (vErrors === null) {
              vErrors = [err6];
            } else {
              vErrors.push(err6);
            }
            errors++;
          }
          if (data.id === void 0) {
            const err7 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
          if (data.outcome === void 0) {
            const err8 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "outcome" }, message: "must have required property 'outcome'" };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
          if (data.output_ids === void 0) {
            const err9 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "output_ids" }, message: "must have required property 'output_ids'" };
            if (vErrors === null) {
              vErrors = [err9];
            } else {
              vErrors.push(err9);
            }
            errors++;
          }
          if (data.output_display === void 0) {
            const err10 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "output_display" }, message: "must have required property 'output_display'" };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
          if (data.passes === void 0) {
            const err11 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "passes" }, message: "must have required property 'passes'" };
            if (vErrors === null) {
              vErrors = [err11];
            } else {
              vErrors.push(err11);
            }
            errors++;
          }
          if (data.precision === void 0) {
            const err12 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "precision" }, message: "must have required property 'precision'" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
          if (data.request_id === void 0) {
            const err13 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "request_id" }, message: "must have required property 'request_id'" };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
          if (data.sequence_ids === void 0) {
            const err14 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "sequence_ids" }, message: "must have required property 'sequence_ids'" };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
          if (data.tokenizer === void 0) {
            const err15 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "tokenizer" }, message: "must have required property 'tokenizer'" };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
          if (data.vocabulary === void 0) {
            const err16 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "vocabulary" }, message: "must have required property 'vocabulary'" };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!func1.call(schema63.properties, key0)) {
              const err17 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
          }
          if (data.checkpoint !== void 0) {
            let data0 = data.checkpoint;
            if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
              if (data0.config === void 0) {
                const err18 = { instancePath: instancePath + "/checkpoint", schemaPath: "#/properties/checkpoint/required", keyword: "required", params: { missingProperty: "config" }, message: "must have required property 'config'" };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
              if (data0.format === void 0) {
                const err19 = { instancePath: instancePath + "/checkpoint", schemaPath: "#/properties/checkpoint/required", keyword: "required", params: { missingProperty: "format" }, message: "must have required property 'format'" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
              if (data0.manifest_sha256 === void 0) {
                const err20 = { instancePath: instancePath + "/checkpoint", schemaPath: "#/properties/checkpoint/required", keyword: "required", params: { missingProperty: "manifest_sha256" }, message: "must have required property 'manifest_sha256'" };
                if (vErrors === null) {
                  vErrors = [err20];
                } else {
                  vErrors.push(err20);
                }
                errors++;
              }
              if (data0.parameters === void 0) {
                const err21 = { instancePath: instancePath + "/checkpoint", schemaPath: "#/properties/checkpoint/required", keyword: "required", params: { missingProperty: "parameters" }, message: "must have required property 'parameters'" };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
              if (data0.provenance === void 0) {
                const err22 = { instancePath: instancePath + "/checkpoint", schemaPath: "#/properties/checkpoint/required", keyword: "required", params: { missingProperty: "provenance" }, message: "must have required property 'provenance'" };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
              for (const key1 in data0) {
                if (!(key1 === "config" || key1 === "format" || key1 === "manifest_sha256" || key1 === "parameters" || key1 === "provenance")) {
                  const err23 = { instancePath: instancePath + "/checkpoint", schemaPath: "#/properties/checkpoint/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err23];
                  } else {
                    vErrors.push(err23);
                  }
                  errors++;
                }
              }
              if (data0.config !== void 0) {
                let data1 = data0.config;
                if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
                  if (data1.vocabulary === void 0) {
                    const err24 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "vocabulary" }, message: "must have required property 'vocabulary'" };
                    if (vErrors === null) {
                      vErrors = [err24];
                    } else {
                      vErrors.push(err24);
                    }
                    errors++;
                  }
                  if (data1.width === void 0) {
                    const err25 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "width" }, message: "must have required property 'width'" };
                    if (vErrors === null) {
                      vErrors = [err25];
                    } else {
                      vErrors.push(err25);
                    }
                    errors++;
                  }
                  if (data1.ffn === void 0) {
                    const err26 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "ffn" }, message: "must have required property 'ffn'" };
                    if (vErrors === null) {
                      vErrors = [err26];
                    } else {
                      vErrors.push(err26);
                    }
                    errors++;
                  }
                  if (data1.context === void 0) {
                    const err27 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "context" }, message: "must have required property 'context'" };
                    if (vErrors === null) {
                      vErrors = [err27];
                    } else {
                      vErrors.push(err27);
                    }
                    errors++;
                  }
                  if (data1.layers === void 0) {
                    const err28 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "layers" }, message: "must have required property 'layers'" };
                    if (vErrors === null) {
                      vErrors = [err28];
                    } else {
                      vErrors.push(err28);
                    }
                    errors++;
                  }
                  if (data1.heads === void 0) {
                    const err29 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "heads" }, message: "must have required property 'heads'" };
                    if (vErrors === null) {
                      vErrors = [err29];
                    } else {
                      vErrors.push(err29);
                    }
                    errors++;
                  }
                  if (data1.epsilon === void 0) {
                    const err30 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "epsilon" }, message: "must have required property 'epsilon'" };
                    if (vErrors === null) {
                      vErrors = [err30];
                    } else {
                      vErrors.push(err30);
                    }
                    errors++;
                  }
                  if (data1.position === void 0) {
                    const err31 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "position" }, message: "must have required property 'position'" };
                    if (vErrors === null) {
                      vErrors = [err31];
                    } else {
                      vErrors.push(err31);
                    }
                    errors++;
                  }
                  if (data1.normalization === void 0) {
                    const err32 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "normalization" }, message: "must have required property 'normalization'" };
                    if (vErrors === null) {
                      vErrors = [err32];
                    } else {
                      vErrors.push(err32);
                    }
                    errors++;
                  }
                  if (data1.activation === void 0) {
                    const err33 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "activation" }, message: "must have required property 'activation'" };
                    if (vErrors === null) {
                      vErrors = [err33];
                    } else {
                      vErrors.push(err33);
                    }
                    errors++;
                  }
                  if (data1.precision === void 0) {
                    const err34 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/required", keyword: "required", params: { missingProperty: "precision" }, message: "must have required property 'precision'" };
                    if (vErrors === null) {
                      vErrors = [err34];
                    } else {
                      vErrors.push(err34);
                    }
                    errors++;
                  }
                  for (const key2 in data1) {
                    if (!func1.call(schema32.properties, key2)) {
                      const err35 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
                      if (vErrors === null) {
                        vErrors = [err35];
                      } else {
                        vErrors.push(err35);
                      }
                      errors++;
                    }
                  }
                  if (data1.vocabulary !== void 0) {
                    let data2 = data1.vocabulary;
                    if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                      const err36 = { instancePath: instancePath + "/checkpoint/config/vocabulary", schemaPath: "#/$defs/ModelArchitecture/properties/vocabulary/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err36];
                      } else {
                        vErrors.push(err36);
                      }
                      errors++;
                    }
                    if (384 !== data2) {
                      const err37 = { instancePath: instancePath + "/checkpoint/config/vocabulary", schemaPath: "#/$defs/ModelArchitecture/properties/vocabulary/const", keyword: "const", params: { allowedValue: 384 }, message: "must be equal to constant" };
                      if (vErrors === null) {
                        vErrors = [err37];
                      } else {
                        vErrors.push(err37);
                      }
                      errors++;
                    }
                  }
                  if (data1.width !== void 0) {
                    let data3 = data1.width;
                    if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                      const err38 = { instancePath: instancePath + "/checkpoint/config/width", schemaPath: "#/$defs/ModelArchitecture/properties/width/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err38];
                      } else {
                        vErrors.push(err38);
                      }
                      errors++;
                    }
                    if (typeof data3 == "number" && isFinite(data3)) {
                      if (data3 > 32 || isNaN(data3)) {
                        const err39 = { instancePath: instancePath + "/checkpoint/config/width", schemaPath: "#/$defs/ModelArchitecture/properties/width/maximum", keyword: "maximum", params: { comparison: "<=", limit: 32 }, message: "must be <= 32" };
                        if (vErrors === null) {
                          vErrors = [err39];
                        } else {
                          vErrors.push(err39);
                        }
                        errors++;
                      }
                      if (data3 < 2 || isNaN(data3)) {
                        const err40 = { instancePath: instancePath + "/checkpoint/config/width", schemaPath: "#/$defs/ModelArchitecture/properties/width/minimum", keyword: "minimum", params: { comparison: ">=", limit: 2 }, message: "must be >= 2" };
                        if (vErrors === null) {
                          vErrors = [err40];
                        } else {
                          vErrors.push(err40);
                        }
                        errors++;
                      }
                    }
                  }
                  if (data1.ffn !== void 0) {
                    let data4 = data1.ffn;
                    if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
                      const err41 = { instancePath: instancePath + "/checkpoint/config/ffn", schemaPath: "#/$defs/ModelArchitecture/properties/ffn/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err41];
                      } else {
                        vErrors.push(err41);
                      }
                      errors++;
                    }
                    if (typeof data4 == "number" && isFinite(data4)) {
                      if (data4 > 128 || isNaN(data4)) {
                        const err42 = { instancePath: instancePath + "/checkpoint/config/ffn", schemaPath: "#/$defs/ModelArchitecture/properties/ffn/maximum", keyword: "maximum", params: { comparison: "<=", limit: 128 }, message: "must be <= 128" };
                        if (vErrors === null) {
                          vErrors = [err42];
                        } else {
                          vErrors.push(err42);
                        }
                        errors++;
                      }
                      if (data4 < 2 || isNaN(data4)) {
                        const err43 = { instancePath: instancePath + "/checkpoint/config/ffn", schemaPath: "#/$defs/ModelArchitecture/properties/ffn/minimum", keyword: "minimum", params: { comparison: ">=", limit: 2 }, message: "must be >= 2" };
                        if (vErrors === null) {
                          vErrors = [err43];
                        } else {
                          vErrors.push(err43);
                        }
                        errors++;
                      }
                    }
                  }
                  if (data1.context !== void 0) {
                    let data5 = data1.context;
                    if (!(typeof data5 == "number" && (!(data5 % 1) && !isNaN(data5)) && isFinite(data5))) {
                      const err44 = { instancePath: instancePath + "/checkpoint/config/context", schemaPath: "#/$defs/ModelArchitecture/properties/context/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err44];
                      } else {
                        vErrors.push(err44);
                      }
                      errors++;
                    }
                    if (typeof data5 == "number" && isFinite(data5)) {
                      if (data5 > 128 || isNaN(data5)) {
                        const err45 = { instancePath: instancePath + "/checkpoint/config/context", schemaPath: "#/$defs/ModelArchitecture/properties/context/maximum", keyword: "maximum", params: { comparison: "<=", limit: 128 }, message: "must be <= 128" };
                        if (vErrors === null) {
                          vErrors = [err45];
                        } else {
                          vErrors.push(err45);
                        }
                        errors++;
                      }
                      if (data5 < 1 || isNaN(data5)) {
                        const err46 = { instancePath: instancePath + "/checkpoint/config/context", schemaPath: "#/$defs/ModelArchitecture/properties/context/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                        if (vErrors === null) {
                          vErrors = [err46];
                        } else {
                          vErrors.push(err46);
                        }
                        errors++;
                      }
                    }
                  }
                  if (data1.layers !== void 0) {
                    let data6 = data1.layers;
                    if (!(typeof data6 == "number" && (!(data6 % 1) && !isNaN(data6)) && isFinite(data6))) {
                      const err47 = { instancePath: instancePath + "/checkpoint/config/layers", schemaPath: "#/$defs/ModelArchitecture/properties/layers/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err47];
                      } else {
                        vErrors.push(err47);
                      }
                      errors++;
                    }
                    if (1 !== data6) {
                      const err48 = { instancePath: instancePath + "/checkpoint/config/layers", schemaPath: "#/$defs/ModelArchitecture/properties/layers/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
                      if (vErrors === null) {
                        vErrors = [err48];
                      } else {
                        vErrors.push(err48);
                      }
                      errors++;
                    }
                  }
                  if (data1.heads !== void 0) {
                    let data7 = data1.heads;
                    if (!(typeof data7 == "number" && (!(data7 % 1) && !isNaN(data7)) && isFinite(data7))) {
                      const err49 = { instancePath: instancePath + "/checkpoint/config/heads", schemaPath: "#/$defs/ModelArchitecture/properties/heads/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err49];
                      } else {
                        vErrors.push(err49);
                      }
                      errors++;
                    }
                    if (1 !== data7) {
                      const err50 = { instancePath: instancePath + "/checkpoint/config/heads", schemaPath: "#/$defs/ModelArchitecture/properties/heads/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
                      if (vErrors === null) {
                        vErrors = [err50];
                      } else {
                        vErrors.push(err50);
                      }
                      errors++;
                    }
                  }
                  if (data1.epsilon !== void 0) {
                    let data8 = data1.epsilon;
                    if (!(typeof data8 == "number" && isFinite(data8))) {
                      const err51 = { instancePath: instancePath + "/checkpoint/config/epsilon", schemaPath: "#/$defs/ModelArchitecture/properties/epsilon/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                      if (vErrors === null) {
                        vErrors = [err51];
                      } else {
                        vErrors.push(err51);
                      }
                      errors++;
                    }
                    if (1e-5 !== data8) {
                      const err52 = { instancePath: instancePath + "/checkpoint/config/epsilon", schemaPath: "#/$defs/ModelArchitecture/properties/epsilon/const", keyword: "const", params: { allowedValue: 1e-5 }, message: "must be equal to constant" };
                      if (vErrors === null) {
                        vErrors = [err52];
                      } else {
                        vErrors.push(err52);
                      }
                      errors++;
                    }
                  }
                  if (data1.position !== void 0) {
                    let data9 = data1.position;
                    if (typeof data9 !== "string") {
                      const err53 = { instancePath: instancePath + "/checkpoint/config/position", schemaPath: "#/$defs/ModelArchitecture/properties/position/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err53];
                      } else {
                        vErrors.push(err53);
                      }
                      errors++;
                    }
                    if ("learned-absolute" !== data9) {
                      const err54 = { instancePath: instancePath + "/checkpoint/config/position", schemaPath: "#/$defs/ModelArchitecture/properties/position/const", keyword: "const", params: { allowedValue: "learned-absolute" }, message: "must be equal to constant" };
                      if (vErrors === null) {
                        vErrors = [err54];
                      } else {
                        vErrors.push(err54);
                      }
                      errors++;
                    }
                  }
                  if (data1.normalization !== void 0) {
                    let data10 = data1.normalization;
                    if (typeof data10 !== "string") {
                      const err55 = { instancePath: instancePath + "/checkpoint/config/normalization", schemaPath: "#/$defs/ModelArchitecture/properties/normalization/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err55];
                      } else {
                        vErrors.push(err55);
                      }
                      errors++;
                    }
                    if ("pre-layernorm" !== data10) {
                      const err56 = { instancePath: instancePath + "/checkpoint/config/normalization", schemaPath: "#/$defs/ModelArchitecture/properties/normalization/const", keyword: "const", params: { allowedValue: "pre-layernorm" }, message: "must be equal to constant" };
                      if (vErrors === null) {
                        vErrors = [err56];
                      } else {
                        vErrors.push(err56);
                      }
                      errors++;
                    }
                  }
                  if (data1.activation !== void 0) {
                    let data11 = data1.activation;
                    if (typeof data11 !== "string") {
                      const err57 = { instancePath: instancePath + "/checkpoint/config/activation", schemaPath: "#/$defs/ModelArchitecture/properties/activation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err57];
                      } else {
                        vErrors.push(err57);
                      }
                      errors++;
                    }
                    if ("gelu-tanh" !== data11) {
                      const err58 = { instancePath: instancePath + "/checkpoint/config/activation", schemaPath: "#/$defs/ModelArchitecture/properties/activation/const", keyword: "const", params: { allowedValue: "gelu-tanh" }, message: "must be equal to constant" };
                      if (vErrors === null) {
                        vErrors = [err58];
                      } else {
                        vErrors.push(err58);
                      }
                      errors++;
                    }
                  }
                  if (data1.precision !== void 0) {
                    let data12 = data1.precision;
                    if (typeof data12 !== "string") {
                      const err59 = { instancePath: instancePath + "/checkpoint/config/precision", schemaPath: "#/$defs/ModelArchitecture/properties/precision/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err59];
                      } else {
                        vErrors.push(err59);
                      }
                      errors++;
                    }
                    if ("binary64" !== data12) {
                      const err60 = { instancePath: instancePath + "/checkpoint/config/precision", schemaPath: "#/$defs/ModelArchitecture/properties/precision/const", keyword: "const", params: { allowedValue: "binary64" }, message: "must be equal to constant" };
                      if (vErrors === null) {
                        vErrors = [err60];
                      } else {
                        vErrors.push(err60);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err61 = { instancePath: instancePath + "/checkpoint/config", schemaPath: "#/$defs/ModelArchitecture/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                  if (vErrors === null) {
                    vErrors = [err61];
                  } else {
                    vErrors.push(err61);
                  }
                  errors++;
                }
              }
              if (data0.format !== void 0) {
                if (typeof data0.format !== "string") {
                  const err62 = { instancePath: instancePath + "/checkpoint/format", schemaPath: "#/properties/checkpoint/properties/format/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err62];
                  } else {
                    vErrors.push(err62);
                  }
                  errors++;
                }
              }
              if (data0.manifest_sha256 !== void 0) {
                if (typeof data0.manifest_sha256 !== "string") {
                  const err63 = { instancePath: instancePath + "/checkpoint/manifest_sha256", schemaPath: "#/properties/checkpoint/properties/manifest_sha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err63];
                  } else {
                    vErrors.push(err63);
                  }
                  errors++;
                }
              }
              if (data0.parameters !== void 0) {
                let data15 = data0.parameters;
                if (data15 && typeof data15 == "object" && !Array.isArray(data15)) {
                  if (data15.attention_output === void 0) {
                    const err64 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "attention_output" }, message: "must have required property 'attention_output'" };
                    if (vErrors === null) {
                      vErrors = [err64];
                    } else {
                      vErrors.push(err64);
                    }
                    errors++;
                  }
                  if (data15.attention_output_bias === void 0) {
                    const err65 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "attention_output_bias" }, message: "must have required property 'attention_output_bias'" };
                    if (vErrors === null) {
                      vErrors = [err65];
                    } else {
                      vErrors.push(err65);
                    }
                    errors++;
                  }
                  if (data15.ff_down === void 0) {
                    const err66 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "ff_down" }, message: "must have required property 'ff_down'" };
                    if (vErrors === null) {
                      vErrors = [err66];
                    } else {
                      vErrors.push(err66);
                    }
                    errors++;
                  }
                  if (data15.ff_down_bias === void 0) {
                    const err67 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "ff_down_bias" }, message: "must have required property 'ff_down_bias'" };
                    if (vErrors === null) {
                      vErrors = [err67];
                    } else {
                      vErrors.push(err67);
                    }
                    errors++;
                  }
                  if (data15.ff_up === void 0) {
                    const err68 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "ff_up" }, message: "must have required property 'ff_up'" };
                    if (vErrors === null) {
                      vErrors = [err68];
                    } else {
                      vErrors.push(err68);
                    }
                    errors++;
                  }
                  if (data15.ff_up_bias === void 0) {
                    const err69 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "ff_up_bias" }, message: "must have required property 'ff_up_bias'" };
                    if (vErrors === null) {
                      vErrors = [err69];
                    } else {
                      vErrors.push(err69);
                    }
                    errors++;
                  }
                  if (data15.key === void 0) {
                    const err70 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "key" }, message: "must have required property 'key'" };
                    if (vErrors === null) {
                      vErrors = [err70];
                    } else {
                      vErrors.push(err70);
                    }
                    errors++;
                  }
                  if (data15.key_bias === void 0) {
                    const err71 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "key_bias" }, message: "must have required property 'key_bias'" };
                    if (vErrors === null) {
                      vErrors = [err71];
                    } else {
                      vErrors.push(err71);
                    }
                    errors++;
                  }
                  if (data15.lm_bias === void 0) {
                    const err72 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "lm_bias" }, message: "must have required property 'lm_bias'" };
                    if (vErrors === null) {
                      vErrors = [err72];
                    } else {
                      vErrors.push(err72);
                    }
                    errors++;
                  }
                  if (data15.lm_head === void 0) {
                    const err73 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "lm_head" }, message: "must have required property 'lm_head'" };
                    if (vErrors === null) {
                      vErrors = [err73];
                    } else {
                      vErrors.push(err73);
                    }
                    errors++;
                  }
                  if (data15.ln1_bias === void 0) {
                    const err74 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "ln1_bias" }, message: "must have required property 'ln1_bias'" };
                    if (vErrors === null) {
                      vErrors = [err74];
                    } else {
                      vErrors.push(err74);
                    }
                    errors++;
                  }
                  if (data15.ln1_scale === void 0) {
                    const err75 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "ln1_scale" }, message: "must have required property 'ln1_scale'" };
                    if (vErrors === null) {
                      vErrors = [err75];
                    } else {
                      vErrors.push(err75);
                    }
                    errors++;
                  }
                  if (data15.ln2_bias === void 0) {
                    const err76 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "ln2_bias" }, message: "must have required property 'ln2_bias'" };
                    if (vErrors === null) {
                      vErrors = [err76];
                    } else {
                      vErrors.push(err76);
                    }
                    errors++;
                  }
                  if (data15.ln2_scale === void 0) {
                    const err77 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "ln2_scale" }, message: "must have required property 'ln2_scale'" };
                    if (vErrors === null) {
                      vErrors = [err77];
                    } else {
                      vErrors.push(err77);
                    }
                    errors++;
                  }
                  if (data15.ln_final_bias === void 0) {
                    const err78 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "ln_final_bias" }, message: "must have required property 'ln_final_bias'" };
                    if (vErrors === null) {
                      vErrors = [err78];
                    } else {
                      vErrors.push(err78);
                    }
                    errors++;
                  }
                  if (data15.ln_final_scale === void 0) {
                    const err79 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "ln_final_scale" }, message: "must have required property 'ln_final_scale'" };
                    if (vErrors === null) {
                      vErrors = [err79];
                    } else {
                      vErrors.push(err79);
                    }
                    errors++;
                  }
                  if (data15.position_embedding === void 0) {
                    const err80 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "position_embedding" }, message: "must have required property 'position_embedding'" };
                    if (vErrors === null) {
                      vErrors = [err80];
                    } else {
                      vErrors.push(err80);
                    }
                    errors++;
                  }
                  if (data15.query === void 0) {
                    const err81 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "query" }, message: "must have required property 'query'" };
                    if (vErrors === null) {
                      vErrors = [err81];
                    } else {
                      vErrors.push(err81);
                    }
                    errors++;
                  }
                  if (data15.query_bias === void 0) {
                    const err82 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "query_bias" }, message: "must have required property 'query_bias'" };
                    if (vErrors === null) {
                      vErrors = [err82];
                    } else {
                      vErrors.push(err82);
                    }
                    errors++;
                  }
                  if (data15.token_embedding === void 0) {
                    const err83 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "token_embedding" }, message: "must have required property 'token_embedding'" };
                    if (vErrors === null) {
                      vErrors = [err83];
                    } else {
                      vErrors.push(err83);
                    }
                    errors++;
                  }
                  if (data15.value === void 0) {
                    const err84 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "value" }, message: "must have required property 'value'" };
                    if (vErrors === null) {
                      vErrors = [err84];
                    } else {
                      vErrors.push(err84);
                    }
                    errors++;
                  }
                  if (data15.value_bias === void 0) {
                    const err85 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/required", keyword: "required", params: { missingProperty: "value_bias" }, message: "must have required property 'value_bias'" };
                    if (vErrors === null) {
                      vErrors = [err85];
                    } else {
                      vErrors.push(err85);
                    }
                    errors++;
                  }
                  for (const key3 in data15) {
                    if (!func1.call(schema63.properties.checkpoint.properties.parameters.properties, key3)) {
                      const err86 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key3 }, message: "must NOT have additional properties" };
                      if (vErrors === null) {
                        vErrors = [err86];
                      } else {
                        vErrors.push(err86);
                      }
                      errors++;
                    }
                  }
                  if (data15.attention_output !== void 0) {
                    let data16 = data15.attention_output;
                    if (Array.isArray(data16)) {
                      const len0 = data16.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        let data17 = data16[i0];
                        if (Array.isArray(data17)) {
                          const len1 = data17.length;
                          for (let i1 = 0; i1 < len1; i1++) {
                            let data18 = data17[i1];
                            if (!(typeof data18 == "number" && isFinite(data18))) {
                              const err87 = { instancePath: instancePath + "/checkpoint/parameters/attention_output/" + i0 + "/" + i1, schemaPath: "#/properties/checkpoint/properties/parameters/properties/attention_output/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                              if (vErrors === null) {
                                vErrors = [err87];
                              } else {
                                vErrors.push(err87);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err88 = { instancePath: instancePath + "/checkpoint/parameters/attention_output/" + i0, schemaPath: "#/properties/checkpoint/properties/parameters/properties/attention_output/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err88];
                          } else {
                            vErrors.push(err88);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err89 = { instancePath: instancePath + "/checkpoint/parameters/attention_output", schemaPath: "#/properties/checkpoint/properties/parameters/properties/attention_output/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err89];
                      } else {
                        vErrors.push(err89);
                      }
                      errors++;
                    }
                  }
                  if (data15.attention_output_bias !== void 0) {
                    let data19 = data15.attention_output_bias;
                    if (Array.isArray(data19)) {
                      const len2 = data19.length;
                      for (let i2 = 0; i2 < len2; i2++) {
                        let data20 = data19[i2];
                        if (!(typeof data20 == "number" && isFinite(data20))) {
                          const err90 = { instancePath: instancePath + "/checkpoint/parameters/attention_output_bias/" + i2, schemaPath: "#/properties/checkpoint/properties/parameters/properties/attention_output_bias/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err90];
                          } else {
                            vErrors.push(err90);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err91 = { instancePath: instancePath + "/checkpoint/parameters/attention_output_bias", schemaPath: "#/properties/checkpoint/properties/parameters/properties/attention_output_bias/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err91];
                      } else {
                        vErrors.push(err91);
                      }
                      errors++;
                    }
                  }
                  if (data15.ff_down !== void 0) {
                    let data21 = data15.ff_down;
                    if (Array.isArray(data21)) {
                      const len3 = data21.length;
                      for (let i3 = 0; i3 < len3; i3++) {
                        let data22 = data21[i3];
                        if (Array.isArray(data22)) {
                          const len4 = data22.length;
                          for (let i4 = 0; i4 < len4; i4++) {
                            let data23 = data22[i4];
                            if (!(typeof data23 == "number" && isFinite(data23))) {
                              const err92 = { instancePath: instancePath + "/checkpoint/parameters/ff_down/" + i3 + "/" + i4, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ff_down/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                              if (vErrors === null) {
                                vErrors = [err92];
                              } else {
                                vErrors.push(err92);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err93 = { instancePath: instancePath + "/checkpoint/parameters/ff_down/" + i3, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ff_down/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err93];
                          } else {
                            vErrors.push(err93);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err94 = { instancePath: instancePath + "/checkpoint/parameters/ff_down", schemaPath: "#/properties/checkpoint/properties/parameters/properties/ff_down/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err94];
                      } else {
                        vErrors.push(err94);
                      }
                      errors++;
                    }
                  }
                  if (data15.ff_down_bias !== void 0) {
                    let data24 = data15.ff_down_bias;
                    if (Array.isArray(data24)) {
                      const len5 = data24.length;
                      for (let i5 = 0; i5 < len5; i5++) {
                        let data25 = data24[i5];
                        if (!(typeof data25 == "number" && isFinite(data25))) {
                          const err95 = { instancePath: instancePath + "/checkpoint/parameters/ff_down_bias/" + i5, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ff_down_bias/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err95];
                          } else {
                            vErrors.push(err95);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err96 = { instancePath: instancePath + "/checkpoint/parameters/ff_down_bias", schemaPath: "#/properties/checkpoint/properties/parameters/properties/ff_down_bias/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err96];
                      } else {
                        vErrors.push(err96);
                      }
                      errors++;
                    }
                  }
                  if (data15.ff_up !== void 0) {
                    let data26 = data15.ff_up;
                    if (Array.isArray(data26)) {
                      const len6 = data26.length;
                      for (let i6 = 0; i6 < len6; i6++) {
                        let data27 = data26[i6];
                        if (Array.isArray(data27)) {
                          const len7 = data27.length;
                          for (let i7 = 0; i7 < len7; i7++) {
                            let data28 = data27[i7];
                            if (!(typeof data28 == "number" && isFinite(data28))) {
                              const err97 = { instancePath: instancePath + "/checkpoint/parameters/ff_up/" + i6 + "/" + i7, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ff_up/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                              if (vErrors === null) {
                                vErrors = [err97];
                              } else {
                                vErrors.push(err97);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err98 = { instancePath: instancePath + "/checkpoint/parameters/ff_up/" + i6, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ff_up/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err98];
                          } else {
                            vErrors.push(err98);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err99 = { instancePath: instancePath + "/checkpoint/parameters/ff_up", schemaPath: "#/properties/checkpoint/properties/parameters/properties/ff_up/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err99];
                      } else {
                        vErrors.push(err99);
                      }
                      errors++;
                    }
                  }
                  if (data15.ff_up_bias !== void 0) {
                    let data29 = data15.ff_up_bias;
                    if (Array.isArray(data29)) {
                      const len8 = data29.length;
                      for (let i8 = 0; i8 < len8; i8++) {
                        let data30 = data29[i8];
                        if (!(typeof data30 == "number" && isFinite(data30))) {
                          const err100 = { instancePath: instancePath + "/checkpoint/parameters/ff_up_bias/" + i8, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ff_up_bias/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err100];
                          } else {
                            vErrors.push(err100);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err101 = { instancePath: instancePath + "/checkpoint/parameters/ff_up_bias", schemaPath: "#/properties/checkpoint/properties/parameters/properties/ff_up_bias/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err101];
                      } else {
                        vErrors.push(err101);
                      }
                      errors++;
                    }
                  }
                  if (data15.key !== void 0) {
                    let data31 = data15.key;
                    if (Array.isArray(data31)) {
                      const len9 = data31.length;
                      for (let i9 = 0; i9 < len9; i9++) {
                        let data32 = data31[i9];
                        if (Array.isArray(data32)) {
                          const len10 = data32.length;
                          for (let i10 = 0; i10 < len10; i10++) {
                            let data33 = data32[i10];
                            if (!(typeof data33 == "number" && isFinite(data33))) {
                              const err102 = { instancePath: instancePath + "/checkpoint/parameters/key/" + i9 + "/" + i10, schemaPath: "#/properties/checkpoint/properties/parameters/properties/key/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                              if (vErrors === null) {
                                vErrors = [err102];
                              } else {
                                vErrors.push(err102);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err103 = { instancePath: instancePath + "/checkpoint/parameters/key/" + i9, schemaPath: "#/properties/checkpoint/properties/parameters/properties/key/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err103];
                          } else {
                            vErrors.push(err103);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err104 = { instancePath: instancePath + "/checkpoint/parameters/key", schemaPath: "#/properties/checkpoint/properties/parameters/properties/key/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err104];
                      } else {
                        vErrors.push(err104);
                      }
                      errors++;
                    }
                  }
                  if (data15.key_bias !== void 0) {
                    let data34 = data15.key_bias;
                    if (Array.isArray(data34)) {
                      const len11 = data34.length;
                      for (let i11 = 0; i11 < len11; i11++) {
                        let data35 = data34[i11];
                        if (!(typeof data35 == "number" && isFinite(data35))) {
                          const err105 = { instancePath: instancePath + "/checkpoint/parameters/key_bias/" + i11, schemaPath: "#/properties/checkpoint/properties/parameters/properties/key_bias/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err105];
                          } else {
                            vErrors.push(err105);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err106 = { instancePath: instancePath + "/checkpoint/parameters/key_bias", schemaPath: "#/properties/checkpoint/properties/parameters/properties/key_bias/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err106];
                      } else {
                        vErrors.push(err106);
                      }
                      errors++;
                    }
                  }
                  if (data15.lm_bias !== void 0) {
                    let data36 = data15.lm_bias;
                    if (Array.isArray(data36)) {
                      const len12 = data36.length;
                      for (let i12 = 0; i12 < len12; i12++) {
                        let data37 = data36[i12];
                        if (!(typeof data37 == "number" && isFinite(data37))) {
                          const err107 = { instancePath: instancePath + "/checkpoint/parameters/lm_bias/" + i12, schemaPath: "#/properties/checkpoint/properties/parameters/properties/lm_bias/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err107];
                          } else {
                            vErrors.push(err107);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err108 = { instancePath: instancePath + "/checkpoint/parameters/lm_bias", schemaPath: "#/properties/checkpoint/properties/parameters/properties/lm_bias/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err108];
                      } else {
                        vErrors.push(err108);
                      }
                      errors++;
                    }
                  }
                  if (data15.lm_head !== void 0) {
                    let data38 = data15.lm_head;
                    if (Array.isArray(data38)) {
                      const len13 = data38.length;
                      for (let i13 = 0; i13 < len13; i13++) {
                        let data39 = data38[i13];
                        if (Array.isArray(data39)) {
                          const len14 = data39.length;
                          for (let i14 = 0; i14 < len14; i14++) {
                            let data40 = data39[i14];
                            if (!(typeof data40 == "number" && isFinite(data40))) {
                              const err109 = { instancePath: instancePath + "/checkpoint/parameters/lm_head/" + i13 + "/" + i14, schemaPath: "#/properties/checkpoint/properties/parameters/properties/lm_head/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                              if (vErrors === null) {
                                vErrors = [err109];
                              } else {
                                vErrors.push(err109);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err110 = { instancePath: instancePath + "/checkpoint/parameters/lm_head/" + i13, schemaPath: "#/properties/checkpoint/properties/parameters/properties/lm_head/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err110];
                          } else {
                            vErrors.push(err110);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err111 = { instancePath: instancePath + "/checkpoint/parameters/lm_head", schemaPath: "#/properties/checkpoint/properties/parameters/properties/lm_head/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err111];
                      } else {
                        vErrors.push(err111);
                      }
                      errors++;
                    }
                  }
                  if (data15.ln1_bias !== void 0) {
                    let data41 = data15.ln1_bias;
                    if (Array.isArray(data41)) {
                      const len15 = data41.length;
                      for (let i15 = 0; i15 < len15; i15++) {
                        let data42 = data41[i15];
                        if (!(typeof data42 == "number" && isFinite(data42))) {
                          const err112 = { instancePath: instancePath + "/checkpoint/parameters/ln1_bias/" + i15, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln1_bias/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err112];
                          } else {
                            vErrors.push(err112);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err113 = { instancePath: instancePath + "/checkpoint/parameters/ln1_bias", schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln1_bias/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err113];
                      } else {
                        vErrors.push(err113);
                      }
                      errors++;
                    }
                  }
                  if (data15.ln1_scale !== void 0) {
                    let data43 = data15.ln1_scale;
                    if (Array.isArray(data43)) {
                      const len16 = data43.length;
                      for (let i16 = 0; i16 < len16; i16++) {
                        let data44 = data43[i16];
                        if (!(typeof data44 == "number" && isFinite(data44))) {
                          const err114 = { instancePath: instancePath + "/checkpoint/parameters/ln1_scale/" + i16, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln1_scale/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err114];
                          } else {
                            vErrors.push(err114);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err115 = { instancePath: instancePath + "/checkpoint/parameters/ln1_scale", schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln1_scale/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err115];
                      } else {
                        vErrors.push(err115);
                      }
                      errors++;
                    }
                  }
                  if (data15.ln2_bias !== void 0) {
                    let data45 = data15.ln2_bias;
                    if (Array.isArray(data45)) {
                      const len17 = data45.length;
                      for (let i17 = 0; i17 < len17; i17++) {
                        let data46 = data45[i17];
                        if (!(typeof data46 == "number" && isFinite(data46))) {
                          const err116 = { instancePath: instancePath + "/checkpoint/parameters/ln2_bias/" + i17, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln2_bias/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err116];
                          } else {
                            vErrors.push(err116);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err117 = { instancePath: instancePath + "/checkpoint/parameters/ln2_bias", schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln2_bias/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err117];
                      } else {
                        vErrors.push(err117);
                      }
                      errors++;
                    }
                  }
                  if (data15.ln2_scale !== void 0) {
                    let data47 = data15.ln2_scale;
                    if (Array.isArray(data47)) {
                      const len18 = data47.length;
                      for (let i18 = 0; i18 < len18; i18++) {
                        let data48 = data47[i18];
                        if (!(typeof data48 == "number" && isFinite(data48))) {
                          const err118 = { instancePath: instancePath + "/checkpoint/parameters/ln2_scale/" + i18, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln2_scale/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err118];
                          } else {
                            vErrors.push(err118);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err119 = { instancePath: instancePath + "/checkpoint/parameters/ln2_scale", schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln2_scale/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err119];
                      } else {
                        vErrors.push(err119);
                      }
                      errors++;
                    }
                  }
                  if (data15.ln_final_bias !== void 0) {
                    let data49 = data15.ln_final_bias;
                    if (Array.isArray(data49)) {
                      const len19 = data49.length;
                      for (let i19 = 0; i19 < len19; i19++) {
                        let data50 = data49[i19];
                        if (!(typeof data50 == "number" && isFinite(data50))) {
                          const err120 = { instancePath: instancePath + "/checkpoint/parameters/ln_final_bias/" + i19, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln_final_bias/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err120];
                          } else {
                            vErrors.push(err120);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err121 = { instancePath: instancePath + "/checkpoint/parameters/ln_final_bias", schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln_final_bias/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err121];
                      } else {
                        vErrors.push(err121);
                      }
                      errors++;
                    }
                  }
                  if (data15.ln_final_scale !== void 0) {
                    let data51 = data15.ln_final_scale;
                    if (Array.isArray(data51)) {
                      const len20 = data51.length;
                      for (let i20 = 0; i20 < len20; i20++) {
                        let data52 = data51[i20];
                        if (!(typeof data52 == "number" && isFinite(data52))) {
                          const err122 = { instancePath: instancePath + "/checkpoint/parameters/ln_final_scale/" + i20, schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln_final_scale/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err122];
                          } else {
                            vErrors.push(err122);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err123 = { instancePath: instancePath + "/checkpoint/parameters/ln_final_scale", schemaPath: "#/properties/checkpoint/properties/parameters/properties/ln_final_scale/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err123];
                      } else {
                        vErrors.push(err123);
                      }
                      errors++;
                    }
                  }
                  if (data15.position_embedding !== void 0) {
                    let data53 = data15.position_embedding;
                    if (Array.isArray(data53)) {
                      const len21 = data53.length;
                      for (let i21 = 0; i21 < len21; i21++) {
                        let data54 = data53[i21];
                        if (Array.isArray(data54)) {
                          const len22 = data54.length;
                          for (let i22 = 0; i22 < len22; i22++) {
                            let data55 = data54[i22];
                            if (!(typeof data55 == "number" && isFinite(data55))) {
                              const err124 = { instancePath: instancePath + "/checkpoint/parameters/position_embedding/" + i21 + "/" + i22, schemaPath: "#/properties/checkpoint/properties/parameters/properties/position_embedding/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                              if (vErrors === null) {
                                vErrors = [err124];
                              } else {
                                vErrors.push(err124);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err125 = { instancePath: instancePath + "/checkpoint/parameters/position_embedding/" + i21, schemaPath: "#/properties/checkpoint/properties/parameters/properties/position_embedding/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err125];
                          } else {
                            vErrors.push(err125);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err126 = { instancePath: instancePath + "/checkpoint/parameters/position_embedding", schemaPath: "#/properties/checkpoint/properties/parameters/properties/position_embedding/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err126];
                      } else {
                        vErrors.push(err126);
                      }
                      errors++;
                    }
                  }
                  if (data15.query !== void 0) {
                    let data56 = data15.query;
                    if (Array.isArray(data56)) {
                      const len23 = data56.length;
                      for (let i23 = 0; i23 < len23; i23++) {
                        let data57 = data56[i23];
                        if (Array.isArray(data57)) {
                          const len24 = data57.length;
                          for (let i24 = 0; i24 < len24; i24++) {
                            let data58 = data57[i24];
                            if (!(typeof data58 == "number" && isFinite(data58))) {
                              const err127 = { instancePath: instancePath + "/checkpoint/parameters/query/" + i23 + "/" + i24, schemaPath: "#/properties/checkpoint/properties/parameters/properties/query/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                              if (vErrors === null) {
                                vErrors = [err127];
                              } else {
                                vErrors.push(err127);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err128 = { instancePath: instancePath + "/checkpoint/parameters/query/" + i23, schemaPath: "#/properties/checkpoint/properties/parameters/properties/query/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err128];
                          } else {
                            vErrors.push(err128);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err129 = { instancePath: instancePath + "/checkpoint/parameters/query", schemaPath: "#/properties/checkpoint/properties/parameters/properties/query/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err129];
                      } else {
                        vErrors.push(err129);
                      }
                      errors++;
                    }
                  }
                  if (data15.query_bias !== void 0) {
                    let data59 = data15.query_bias;
                    if (Array.isArray(data59)) {
                      const len25 = data59.length;
                      for (let i25 = 0; i25 < len25; i25++) {
                        let data60 = data59[i25];
                        if (!(typeof data60 == "number" && isFinite(data60))) {
                          const err130 = { instancePath: instancePath + "/checkpoint/parameters/query_bias/" + i25, schemaPath: "#/properties/checkpoint/properties/parameters/properties/query_bias/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err130];
                          } else {
                            vErrors.push(err130);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err131 = { instancePath: instancePath + "/checkpoint/parameters/query_bias", schemaPath: "#/properties/checkpoint/properties/parameters/properties/query_bias/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err131];
                      } else {
                        vErrors.push(err131);
                      }
                      errors++;
                    }
                  }
                  if (data15.token_embedding !== void 0) {
                    let data61 = data15.token_embedding;
                    if (Array.isArray(data61)) {
                      const len26 = data61.length;
                      for (let i26 = 0; i26 < len26; i26++) {
                        let data62 = data61[i26];
                        if (Array.isArray(data62)) {
                          const len27 = data62.length;
                          for (let i27 = 0; i27 < len27; i27++) {
                            let data63 = data62[i27];
                            if (!(typeof data63 == "number" && isFinite(data63))) {
                              const err132 = { instancePath: instancePath + "/checkpoint/parameters/token_embedding/" + i26 + "/" + i27, schemaPath: "#/properties/checkpoint/properties/parameters/properties/token_embedding/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                              if (vErrors === null) {
                                vErrors = [err132];
                              } else {
                                vErrors.push(err132);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err133 = { instancePath: instancePath + "/checkpoint/parameters/token_embedding/" + i26, schemaPath: "#/properties/checkpoint/properties/parameters/properties/token_embedding/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err133];
                          } else {
                            vErrors.push(err133);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err134 = { instancePath: instancePath + "/checkpoint/parameters/token_embedding", schemaPath: "#/properties/checkpoint/properties/parameters/properties/token_embedding/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err134];
                      } else {
                        vErrors.push(err134);
                      }
                      errors++;
                    }
                  }
                  if (data15.value !== void 0) {
                    let data64 = data15.value;
                    if (Array.isArray(data64)) {
                      const len28 = data64.length;
                      for (let i28 = 0; i28 < len28; i28++) {
                        let data65 = data64[i28];
                        if (Array.isArray(data65)) {
                          const len29 = data65.length;
                          for (let i29 = 0; i29 < len29; i29++) {
                            let data66 = data65[i29];
                            if (!(typeof data66 == "number" && isFinite(data66))) {
                              const err135 = { instancePath: instancePath + "/checkpoint/parameters/value/" + i28 + "/" + i29, schemaPath: "#/properties/checkpoint/properties/parameters/properties/value/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                              if (vErrors === null) {
                                vErrors = [err135];
                              } else {
                                vErrors.push(err135);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err136 = { instancePath: instancePath + "/checkpoint/parameters/value/" + i28, schemaPath: "#/properties/checkpoint/properties/parameters/properties/value/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err136];
                          } else {
                            vErrors.push(err136);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err137 = { instancePath: instancePath + "/checkpoint/parameters/value", schemaPath: "#/properties/checkpoint/properties/parameters/properties/value/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err137];
                      } else {
                        vErrors.push(err137);
                      }
                      errors++;
                    }
                  }
                  if (data15.value_bias !== void 0) {
                    let data67 = data15.value_bias;
                    if (Array.isArray(data67)) {
                      const len30 = data67.length;
                      for (let i30 = 0; i30 < len30; i30++) {
                        let data68 = data67[i30];
                        if (!(typeof data68 == "number" && isFinite(data68))) {
                          const err138 = { instancePath: instancePath + "/checkpoint/parameters/value_bias/" + i30, schemaPath: "#/properties/checkpoint/properties/parameters/properties/value_bias/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                          if (vErrors === null) {
                            vErrors = [err138];
                          } else {
                            vErrors.push(err138);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err139 = { instancePath: instancePath + "/checkpoint/parameters/value_bias", schemaPath: "#/properties/checkpoint/properties/parameters/properties/value_bias/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err139];
                      } else {
                        vErrors.push(err139);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err140 = { instancePath: instancePath + "/checkpoint/parameters", schemaPath: "#/properties/checkpoint/properties/parameters/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                  if (vErrors === null) {
                    vErrors = [err140];
                  } else {
                    vErrors.push(err140);
                  }
                  errors++;
                }
              }
              if (data0.provenance !== void 0) {
                let data69 = data0.provenance;
                if (data69 && typeof data69 == "object" && !Array.isArray(data69)) {
                  if (data69.initializer === void 0) {
                    const err141 = { instancePath: instancePath + "/checkpoint/provenance", schemaPath: "#/properties/checkpoint/properties/provenance/required", keyword: "required", params: { missingProperty: "initializer" }, message: "must have required property 'initializer'" };
                    if (vErrors === null) {
                      vErrors = [err141];
                    } else {
                      vErrors.push(err141);
                    }
                    errors++;
                  }
                  if (data69.kind === void 0) {
                    const err142 = { instancePath: instancePath + "/checkpoint/provenance", schemaPath: "#/properties/checkpoint/properties/provenance/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                    if (vErrors === null) {
                      vErrors = [err142];
                    } else {
                      vErrors.push(err142);
                    }
                    errors++;
                  }
                  if (data69.seed === void 0) {
                    const err143 = { instancePath: instancePath + "/checkpoint/provenance", schemaPath: "#/properties/checkpoint/properties/provenance/required", keyword: "required", params: { missingProperty: "seed" }, message: "must have required property 'seed'" };
                    if (vErrors === null) {
                      vErrors = [err143];
                    } else {
                      vErrors.push(err143);
                    }
                    errors++;
                  }
                  for (const key4 in data69) {
                    if (!(key4 === "initializer" || key4 === "kind" || key4 === "seed")) {
                      const err144 = { instancePath: instancePath + "/checkpoint/provenance", schemaPath: "#/properties/checkpoint/properties/provenance/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key4 }, message: "must NOT have additional properties" };
                      if (vErrors === null) {
                        vErrors = [err144];
                      } else {
                        vErrors.push(err144);
                      }
                      errors++;
                    }
                  }
                  if (data69.initializer !== void 0) {
                    if (typeof data69.initializer !== "string") {
                      const err145 = { instancePath: instancePath + "/checkpoint/provenance/initializer", schemaPath: "#/properties/checkpoint/properties/provenance/properties/initializer/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err145];
                      } else {
                        vErrors.push(err145);
                      }
                      errors++;
                    }
                  }
                  if (data69.kind !== void 0) {
                    if (typeof data69.kind !== "string") {
                      const err146 = { instancePath: instancePath + "/checkpoint/provenance/kind", schemaPath: "#/properties/checkpoint/properties/provenance/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err146];
                      } else {
                        vErrors.push(err146);
                      }
                      errors++;
                    }
                  }
                  if (data69.seed !== void 0) {
                    let data72 = data69.seed;
                    if (!(typeof data72 == "number" && (!(data72 % 1) && !isNaN(data72)) && isFinite(data72))) {
                      const err147 = { instancePath: instancePath + "/checkpoint/provenance/seed", schemaPath: "#/properties/checkpoint/properties/provenance/properties/seed/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err147];
                      } else {
                        vErrors.push(err147);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err148 = { instancePath: instancePath + "/checkpoint/provenance", schemaPath: "#/properties/checkpoint/properties/provenance/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                  if (vErrors === null) {
                    vErrors = [err148];
                  } else {
                    vErrors.push(err148);
                  }
                  errors++;
                }
              }
            } else {
              const err149 = { instancePath: instancePath + "/checkpoint", schemaPath: "#/properties/checkpoint/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err149];
              } else {
                vErrors.push(err149);
              }
              errors++;
            }
          }
          if (data.code !== void 0) {
            let data73 = data.code;
            if (data73 && typeof data73 == "object" && !Array.isArray(data73)) {
              if (data73.python === void 0) {
                const err150 = { instancePath: instancePath + "/code", schemaPath: "#/properties/code/required", keyword: "required", params: { missingProperty: "python" }, message: "must have required property 'python'" };
                if (vErrors === null) {
                  vErrors = [err150];
                } else {
                  vErrors.push(err150);
                }
                errors++;
              }
              if (data73.revision === void 0) {
                const err151 = { instancePath: instancePath + "/code", schemaPath: "#/properties/code/required", keyword: "required", params: { missingProperty: "revision" }, message: "must have required property 'revision'" };
                if (vErrors === null) {
                  vErrors = [err151];
                } else {
                  vErrors.push(err151);
                }
                errors++;
              }
              if (data73.source_sha256 === void 0) {
                const err152 = { instancePath: instancePath + "/code", schemaPath: "#/properties/code/required", keyword: "required", params: { missingProperty: "source_sha256" }, message: "must have required property 'source_sha256'" };
                if (vErrors === null) {
                  vErrors = [err152];
                } else {
                  vErrors.push(err152);
                }
                errors++;
              }
              if (data73.sources === void 0) {
                const err153 = { instancePath: instancePath + "/code", schemaPath: "#/properties/code/required", keyword: "required", params: { missingProperty: "sources" }, message: "must have required property 'sources'" };
                if (vErrors === null) {
                  vErrors = [err153];
                } else {
                  vErrors.push(err153);
                }
                errors++;
              }
              for (const key5 in data73) {
                if (!(key5 === "python" || key5 === "revision" || key5 === "source_sha256" || key5 === "sources")) {
                  const err154 = { instancePath: instancePath + "/code", schemaPath: "#/properties/code/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key5 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err154];
                  } else {
                    vErrors.push(err154);
                  }
                  errors++;
                }
              }
              if (data73.python !== void 0) {
                if (typeof data73.python !== "string") {
                  const err155 = { instancePath: instancePath + "/code/python", schemaPath: "#/properties/code/properties/python/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err155];
                  } else {
                    vErrors.push(err155);
                  }
                  errors++;
                }
              }
              if (data73.revision !== void 0) {
                if (typeof data73.revision !== "string") {
                  const err156 = { instancePath: instancePath + "/code/revision", schemaPath: "#/properties/code/properties/revision/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err156];
                  } else {
                    vErrors.push(err156);
                  }
                  errors++;
                }
              }
              if (data73.source_sha256 !== void 0) {
                if (typeof data73.source_sha256 !== "string") {
                  const err157 = { instancePath: instancePath + "/code/source_sha256", schemaPath: "#/properties/code/properties/source_sha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err157];
                  } else {
                    vErrors.push(err157);
                  }
                  errors++;
                }
              }
              if (data73.sources !== void 0) {
                let data77 = data73.sources;
                if (data77 && typeof data77 == "object" && !Array.isArray(data77)) {
                  for (const key6 in data77) {
                    let data78 = data77[key6];
                    if (typeof data78 === "string") {
                      if (!pattern4.test(data78)) {
                        const err158 = { instancePath: instancePath + "/code/sources/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/code/properties/sources/additionalProperties/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{64}$" }, message: 'must match pattern "^[0-9a-f]{64}$"' };
                        if (vErrors === null) {
                          vErrors = [err158];
                        } else {
                          vErrors.push(err158);
                        }
                        errors++;
                      }
                    } else {
                      const err159 = { instancePath: instancePath + "/code/sources/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/code/properties/sources/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err159];
                      } else {
                        vErrors.push(err159);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err160 = { instancePath: instancePath + "/code/sources", schemaPath: "#/properties/code/properties/sources/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                  if (vErrors === null) {
                    vErrors = [err160];
                  } else {
                    vErrors.push(err160);
                  }
                  errors++;
                }
              }
            } else {
              const err161 = { instancePath: instancePath + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err161];
              } else {
                vErrors.push(err161);
              }
              errors++;
            }
          }
          if (data.contract_sha256 !== void 0) {
            if (typeof data.contract_sha256 !== "string") {
              const err162 = { instancePath: instancePath + "/contract_sha256", schemaPath: "#/properties/contract_sha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err162];
              } else {
                vErrors.push(err162);
              }
              errors++;
            }
          }
          if (data.declaration !== void 0) {
            if (!validate28(data.declaration, { instancePath: instancePath + "/declaration", parentData: data, parentDataProperty: "declaration", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
              errors = vErrors.length;
            }
          }
          if (data.decoding_contract !== void 0) {
            let data81 = data.decoding_contract;
            if (data81 && typeof data81 == "object" && !Array.isArray(data81)) {
              if (data81.choice === void 0) {
                const err163 = { instancePath: instancePath + "/decoding_contract", schemaPath: "#/properties/decoding_contract/required", keyword: "required", params: { missingProperty: "choice" }, message: "must have required property 'choice'" };
                if (vErrors === null) {
                  vErrors = [err163];
                } else {
                  vErrors.push(err163);
                }
                errors++;
              }
              if (data81.explanation === void 0) {
                const err164 = { instancePath: instancePath + "/decoding_contract", schemaPath: "#/properties/decoding_contract/required", keyword: "required", params: { missingProperty: "explanation" }, message: "must have required property 'explanation'" };
                if (vErrors === null) {
                  vErrors = [err164];
                } else {
                  vErrors.push(err164);
                }
                errors++;
              }
              if (data81.rule === void 0) {
                const err165 = { instancePath: instancePath + "/decoding_contract", schemaPath: "#/properties/decoding_contract/required", keyword: "required", params: { missingProperty: "rule" }, message: "must have required property 'rule'" };
                if (vErrors === null) {
                  vErrors = [err165];
                } else {
                  vErrors.push(err165);
                }
                errors++;
              }
              for (const key7 in data81) {
                if (!(key7 === "choice" || key7 === "explanation" || key7 === "rule")) {
                  const err166 = { instancePath: instancePath + "/decoding_contract", schemaPath: "#/properties/decoding_contract/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key7 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err166];
                  } else {
                    vErrors.push(err166);
                  }
                  errors++;
                }
              }
              if (data81.choice !== void 0) {
                if (typeof data81.choice !== "string") {
                  const err167 = { instancePath: instancePath + "/decoding_contract/choice", schemaPath: "#/properties/decoding_contract/properties/choice/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err167];
                  } else {
                    vErrors.push(err167);
                  }
                  errors++;
                }
              }
              if (data81.explanation !== void 0) {
                if (typeof data81.explanation !== "string") {
                  const err168 = { instancePath: instancePath + "/decoding_contract/explanation", schemaPath: "#/properties/decoding_contract/properties/explanation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err168];
                  } else {
                    vErrors.push(err168);
                  }
                  errors++;
                }
              }
              if (data81.rule !== void 0) {
                if (typeof data81.rule !== "string") {
                  const err169 = { instancePath: instancePath + "/decoding_contract/rule", schemaPath: "#/properties/decoding_contract/properties/rule/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err169];
                  } else {
                    vErrors.push(err169);
                  }
                  errors++;
                }
              }
            } else {
              const err170 = { instancePath: instancePath + "/decoding_contract", schemaPath: "#/properties/decoding_contract/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err170];
              } else {
                vErrors.push(err170);
              }
              errors++;
            }
          }
          if (data.evidence !== void 0) {
            if (typeof data.evidence !== "string") {
              const err171 = { instancePath: instancePath + "/evidence", schemaPath: "#/properties/evidence/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err171];
              } else {
                vErrors.push(err171);
              }
              errors++;
            }
          }
          if (data.format !== void 0) {
            let data86 = data.format;
            if (typeof data86 !== "string") {
              const err172 = { instancePath: instancePath + "/format", schemaPath: "#/properties/format/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err172];
              } else {
                vErrors.push(err172);
              }
              errors++;
            }
            if ("naive-gpt-run-v2" !== data86) {
              const err173 = { instancePath: instancePath + "/format", schemaPath: "#/properties/format/const", keyword: "const", params: { allowedValue: "naive-gpt-run-v2" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err173];
              } else {
                vErrors.push(err173);
              }
              errors++;
            }
          }
          if (data.id !== void 0) {
            if (typeof data.id !== "string") {
              const err174 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err174];
              } else {
                vErrors.push(err174);
              }
              errors++;
            }
          }
          if (data.outcome !== void 0) {
            let data88 = data.outcome;
            if (data88 && typeof data88 == "object" && !Array.isArray(data88)) {
              if (data88.selected_tokens === void 0) {
                const err175 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/required", keyword: "required", params: { missingProperty: "selected_tokens" }, message: "must have required property 'selected_tokens'" };
                if (vErrors === null) {
                  vErrors = [err175];
                } else {
                  vErrors.push(err175);
                }
                errors++;
              }
              if (data88.delivered_tokens === void 0) {
                const err176 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/required", keyword: "required", params: { missingProperty: "delivered_tokens" }, message: "must have required property 'delivered_tokens'" };
                if (vErrors === null) {
                  vErrors = [err176];
                } else {
                  vErrors.push(err176);
                }
                errors++;
              }
              if (data88.unused_budget === void 0) {
                const err177 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/required", keyword: "required", params: { missingProperty: "unused_budget" }, message: "must have required property 'unused_budget'" };
                if (vErrors === null) {
                  vErrors = [err177];
                } else {
                  vErrors.push(err177);
                }
                errors++;
              }
              if (data88.stop_reason === void 0) {
                const err178 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/required", keyword: "required", params: { missingProperty: "stop_reason" }, message: "must have required property 'stop_reason'" };
                if (vErrors === null) {
                  vErrors = [err178];
                } else {
                  vErrors.push(err178);
                }
                errors++;
              }
              if (data88.complete === void 0) {
                const err179 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/required", keyword: "required", params: { missingProperty: "complete" }, message: "must have required property 'complete'" };
                if (vErrors === null) {
                  vErrors = [err179];
                } else {
                  vErrors.push(err179);
                }
                errors++;
              }
              for (const key8 in data88) {
                if (!(key8 === "selected_tokens" || key8 === "delivered_tokens" || key8 === "unused_budget" || key8 === "stop_reason" || key8 === "complete")) {
                  const err180 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key8 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err180];
                  } else {
                    vErrors.push(err180);
                  }
                  errors++;
                }
              }
              if (data88.selected_tokens !== void 0) {
                let data89 = data88.selected_tokens;
                if (!(typeof data89 == "number" && (!(data89 % 1) && !isNaN(data89)) && isFinite(data89))) {
                  const err181 = { instancePath: instancePath + "/outcome/selected_tokens", schemaPath: "#/$defs/RunOutcome/properties/selected_tokens/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err181];
                  } else {
                    vErrors.push(err181);
                  }
                  errors++;
                }
                if (typeof data89 == "number" && isFinite(data89)) {
                  if (data89 < 1 || isNaN(data89)) {
                    const err182 = { instancePath: instancePath + "/outcome/selected_tokens", schemaPath: "#/$defs/RunOutcome/properties/selected_tokens/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                    if (vErrors === null) {
                      vErrors = [err182];
                    } else {
                      vErrors.push(err182);
                    }
                    errors++;
                  }
                }
              }
              if (data88.delivered_tokens !== void 0) {
                let data90 = data88.delivered_tokens;
                if (!(typeof data90 == "number" && (!(data90 % 1) && !isNaN(data90)) && isFinite(data90))) {
                  const err183 = { instancePath: instancePath + "/outcome/delivered_tokens", schemaPath: "#/$defs/RunOutcome/properties/delivered_tokens/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err183];
                  } else {
                    vErrors.push(err183);
                  }
                  errors++;
                }
                if (typeof data90 == "number" && isFinite(data90)) {
                  if (data90 < 0 || isNaN(data90)) {
                    const err184 = { instancePath: instancePath + "/outcome/delivered_tokens", schemaPath: "#/$defs/RunOutcome/properties/delivered_tokens/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                    if (vErrors === null) {
                      vErrors = [err184];
                    } else {
                      vErrors.push(err184);
                    }
                    errors++;
                  }
                }
              }
              if (data88.unused_budget !== void 0) {
                let data91 = data88.unused_budget;
                if (!(typeof data91 == "number" && (!(data91 % 1) && !isNaN(data91)) && isFinite(data91))) {
                  const err185 = { instancePath: instancePath + "/outcome/unused_budget", schemaPath: "#/$defs/RunOutcome/properties/unused_budget/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err185];
                  } else {
                    vErrors.push(err185);
                  }
                  errors++;
                }
                if (typeof data91 == "number" && isFinite(data91)) {
                  if (data91 < 0 || isNaN(data91)) {
                    const err186 = { instancePath: instancePath + "/outcome/unused_budget", schemaPath: "#/$defs/RunOutcome/properties/unused_budget/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                    if (vErrors === null) {
                      vErrors = [err186];
                    } else {
                      vErrors.push(err186);
                    }
                    errors++;
                  }
                }
              }
              if (data88.stop_reason !== void 0) {
                let data92 = data88.stop_reason;
                if (typeof data92 !== "string") {
                  const err187 = { instancePath: instancePath + "/outcome/stop_reason", schemaPath: "#/$defs/RunOutcome/properties/stop_reason/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err187];
                  } else {
                    vErrors.push(err187);
                  }
                  errors++;
                }
                if (!(data92 === "turn_end" || data92 === "output_budget")) {
                  const err188 = { instancePath: instancePath + "/outcome/stop_reason", schemaPath: "#/$defs/RunOutcome/properties/stop_reason/enum", keyword: "enum", params: { allowedValues: schema39.properties.stop_reason.enum }, message: "must be equal to one of the allowed values" };
                  if (vErrors === null) {
                    vErrors = [err188];
                  } else {
                    vErrors.push(err188);
                  }
                  errors++;
                }
              }
              if (data88.complete !== void 0) {
                if (typeof data88.complete !== "boolean") {
                  const err189 = { instancePath: instancePath + "/outcome/complete", schemaPath: "#/$defs/RunOutcome/properties/complete/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
                  if (vErrors === null) {
                    vErrors = [err189];
                  } else {
                    vErrors.push(err189);
                  }
                  errors++;
                }
              }
            } else {
              const err190 = { instancePath: instancePath + "/outcome", schemaPath: "#/$defs/RunOutcome/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err190];
              } else {
                vErrors.push(err190);
              }
              errors++;
            }
          }
          if (data.output_ids !== void 0) {
            let data94 = data.output_ids;
            if (Array.isArray(data94)) {
              const len31 = data94.length;
              for (let i31 = 0; i31 < len31; i31++) {
                let data95 = data94[i31];
                if (!(typeof data95 == "number" && (!(data95 % 1) && !isNaN(data95)) && isFinite(data95))) {
                  const err191 = { instancePath: instancePath + "/output_ids/" + i31, schemaPath: "#/properties/output_ids/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err191];
                  } else {
                    vErrors.push(err191);
                  }
                  errors++;
                }
              }
            } else {
              const err192 = { instancePath: instancePath + "/output_ids", schemaPath: "#/properties/output_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
              if (vErrors === null) {
                vErrors = [err192];
              } else {
                vErrors.push(err192);
              }
              errors++;
            }
          }
          if (data.output_display !== void 0) {
            if (typeof data.output_display !== "string") {
              const err193 = { instancePath: instancePath + "/output_display", schemaPath: "#/properties/output_display/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err193];
              } else {
                vErrors.push(err193);
              }
              errors++;
            }
          }
          if (data.passes !== void 0) {
            let data97 = data.passes;
            if (Array.isArray(data97)) {
              const len32 = data97.length;
              for (let i32 = 0; i32 < len32; i32++) {
                let data98 = data97[i32];
                if (data98 && typeof data98 == "object" && !Array.isArray(data98)) {
                  if (data98.display_so_far === void 0) {
                    const err194 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "display_so_far" }, message: "must have required property 'display_so_far'" };
                    if (vErrors === null) {
                      vErrors = [err194];
                    } else {
                      vErrors.push(err194);
                    }
                    errors++;
                  }
                  if (data98.execution === void 0) {
                    const err195 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "execution" }, message: "must have required property 'execution'" };
                    if (vErrors === null) {
                      vErrors = [err195];
                    } else {
                      vErrors.push(err195);
                    }
                    errors++;
                  }
                  if (data98.id === void 0) {
                    const err196 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
                    if (vErrors === null) {
                      vErrors = [err196];
                    } else {
                      vErrors.push(err196);
                    }
                    errors++;
                  }
                  if (data98.input_ids === void 0) {
                    const err197 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "input_ids" }, message: "must have required property 'input_ids'" };
                    if (vErrors === null) {
                      vErrors = [err197];
                    } else {
                      vErrors.push(err197);
                    }
                    errors++;
                  }
                  if (data98.nodes === void 0) {
                    const err198 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "nodes" }, message: "must have required property 'nodes'" };
                    if (vErrors === null) {
                      vErrors = [err198];
                    } else {
                      vErrors.push(err198);
                    }
                    errors++;
                  }
                  if (data98.output_position === void 0) {
                    const err199 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "output_position" }, message: "must have required property 'output_position'" };
                    if (vErrors === null) {
                      vErrors = [err199];
                    } else {
                      vErrors.push(err199);
                    }
                    errors++;
                  }
                  if (data98.phase === void 0) {
                    const err200 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "phase" }, message: "must have required property 'phase'" };
                    if (vErrors === null) {
                      vErrors = [err200];
                    } else {
                      vErrors.push(err200);
                    }
                    errors++;
                  }
                  if (data98.positions === void 0) {
                    const err201 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "positions" }, message: "must have required property 'positions'" };
                    if (vErrors === null) {
                      vErrors = [err201];
                    } else {
                      vErrors.push(err201);
                    }
                    errors++;
                  }
                  if (data98.request_id === void 0) {
                    const err202 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "request_id" }, message: "must have required property 'request_id'" };
                    if (vErrors === null) {
                      vErrors = [err202];
                    } else {
                      vErrors.push(err202);
                    }
                    errors++;
                  }
                  if (data98.run_id === void 0) {
                    const err203 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "run_id" }, message: "must have required property 'run_id'" };
                    if (vErrors === null) {
                      vErrors = [err203];
                    } else {
                      vErrors.push(err203);
                    }
                    errors++;
                  }
                  if (data98.selection === void 0) {
                    const err204 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "selection" }, message: "must have required property 'selection'" };
                    if (vErrors === null) {
                      vErrors = [err204];
                    } else {
                      vErrors.push(err204);
                    }
                    errors++;
                  }
                  if (data98.selection_position === void 0) {
                    const err205 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "selection_position" }, message: "must have required property 'selection_position'" };
                    if (vErrors === null) {
                      vErrors = [err205];
                    } else {
                      vErrors.push(err205);
                    }
                    errors++;
                  }
                  if (data98.step === void 0) {
                    const err206 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/required", keyword: "required", params: { missingProperty: "step" }, message: "must have required property 'step'" };
                    if (vErrors === null) {
                      vErrors = [err206];
                    } else {
                      vErrors.push(err206);
                    }
                    errors++;
                  }
                  for (const key9 in data98) {
                    if (!func1.call(schema63.properties.passes.items.properties, key9)) {
                      const err207 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key9 }, message: "must NOT have additional properties" };
                      if (vErrors === null) {
                        vErrors = [err207];
                      } else {
                        vErrors.push(err207);
                      }
                      errors++;
                    }
                  }
                  if (data98.display_so_far !== void 0) {
                    if (typeof data98.display_so_far !== "string") {
                      const err208 = { instancePath: instancePath + "/passes/" + i32 + "/display_so_far", schemaPath: "#/properties/passes/items/properties/display_so_far/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err208];
                      } else {
                        vErrors.push(err208);
                      }
                      errors++;
                    }
                  }
                  if (data98.execution !== void 0) {
                    if (typeof data98.execution !== "string") {
                      const err209 = { instancePath: instancePath + "/passes/" + i32 + "/execution", schemaPath: "#/properties/passes/items/properties/execution/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err209];
                      } else {
                        vErrors.push(err209);
                      }
                      errors++;
                    }
                  }
                  if (data98.id !== void 0) {
                    if (typeof data98.id !== "string") {
                      const err210 = { instancePath: instancePath + "/passes/" + i32 + "/id", schemaPath: "#/properties/passes/items/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err210];
                      } else {
                        vErrors.push(err210);
                      }
                      errors++;
                    }
                  }
                  if (data98.input_ids !== void 0) {
                    let data102 = data98.input_ids;
                    if (Array.isArray(data102)) {
                      const len33 = data102.length;
                      for (let i33 = 0; i33 < len33; i33++) {
                        let data103 = data102[i33];
                        if (!(typeof data103 == "number" && (!(data103 % 1) && !isNaN(data103)) && isFinite(data103))) {
                          const err211 = { instancePath: instancePath + "/passes/" + i32 + "/input_ids/" + i33, schemaPath: "#/properties/passes/items/properties/input_ids/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                          if (vErrors === null) {
                            vErrors = [err211];
                          } else {
                            vErrors.push(err211);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err212 = { instancePath: instancePath + "/passes/" + i32 + "/input_ids", schemaPath: "#/properties/passes/items/properties/input_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err212];
                      } else {
                        vErrors.push(err212);
                      }
                      errors++;
                    }
                  }
                  if (data98.nodes !== void 0) {
                    let data104 = data98.nodes;
                    if (Array.isArray(data104)) {
                      const len34 = data104.length;
                      for (let i34 = 0; i34 < len34; i34++) {
                        let data105 = data104[i34];
                        if (data105 && typeof data105 == "object" && !Array.isArray(data105)) {
                          if (data105.axes === void 0) {
                            const err213 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "axes" }, message: "must have required property 'axes'" };
                            if (vErrors === null) {
                              vErrors = [err213];
                            } else {
                              vErrors.push(err213);
                            }
                            errors++;
                          }
                          if (data105.dtype === void 0) {
                            const err214 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "dtype" }, message: "must have required property 'dtype'" };
                            if (vErrors === null) {
                              vErrors = [err214];
                            } else {
                              vErrors.push(err214);
                            }
                            errors++;
                          }
                          if (data105.formula === void 0) {
                            const err215 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "formula" }, message: "must have required property 'formula'" };
                            if (vErrors === null) {
                              vErrors = [err215];
                            } else {
                              vErrors.push(err215);
                            }
                            errors++;
                          }
                          if (data105.id === void 0) {
                            const err216 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
                            if (vErrors === null) {
                              vErrors = [err216];
                            } else {
                              vErrors.push(err216);
                            }
                            errors++;
                          }
                          if (data105.inputs === void 0) {
                            const err217 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "inputs" }, message: "must have required property 'inputs'" };
                            if (vErrors === null) {
                              vErrors = [err217];
                            } else {
                              vErrors.push(err217);
                            }
                            errors++;
                          }
                          if (data105.layer === void 0) {
                            const err218 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "layer" }, message: "must have required property 'layer'" };
                            if (vErrors === null) {
                              vErrors = [err218];
                            } else {
                              vErrors.push(err218);
                            }
                            errors++;
                          }
                          if (data105.name === void 0) {
                            const err219 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" };
                            if (vErrors === null) {
                              vErrors = [err219];
                            } else {
                              vErrors.push(err219);
                            }
                            errors++;
                          }
                          if (data105.positions === void 0) {
                            const err220 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "positions" }, message: "must have required property 'positions'" };
                            if (vErrors === null) {
                              vErrors = [err220];
                            } else {
                              vErrors.push(err220);
                            }
                            errors++;
                          }
                          if (data105.request_id === void 0) {
                            const err221 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "request_id" }, message: "must have required property 'request_id'" };
                            if (vErrors === null) {
                              vErrors = [err221];
                            } else {
                              vErrors.push(err221);
                            }
                            errors++;
                          }
                          if (data105.run_id === void 0) {
                            const err222 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "run_id" }, message: "must have required property 'run_id'" };
                            if (vErrors === null) {
                              vErrors = [err222];
                            } else {
                              vErrors.push(err222);
                            }
                            errors++;
                          }
                          if (data105.shape === void 0) {
                            const err223 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "shape" }, message: "must have required property 'shape'" };
                            if (vErrors === null) {
                              vErrors = [err223];
                            } else {
                              vErrors.push(err223);
                            }
                            errors++;
                          }
                          if (data105.step === void 0) {
                            const err224 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "step" }, message: "must have required property 'step'" };
                            if (vErrors === null) {
                              vErrors = [err224];
                            } else {
                              vErrors.push(err224);
                            }
                            errors++;
                          }
                          if (data105.term === void 0) {
                            const err225 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "term" }, message: "must have required property 'term'" };
                            if (vErrors === null) {
                              vErrors = [err225];
                            } else {
                              vErrors.push(err225);
                            }
                            errors++;
                          }
                          if (data105.values === void 0) {
                            const err226 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/required", keyword: "required", params: { missingProperty: "values" }, message: "must have required property 'values'" };
                            if (vErrors === null) {
                              vErrors = [err226];
                            } else {
                              vErrors.push(err226);
                            }
                            errors++;
                          }
                          for (const key10 in data105) {
                            if (!func1.call(schema63.properties.passes.items.properties.nodes.items.properties, key10)) {
                              const err227 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key10 }, message: "must NOT have additional properties" };
                              if (vErrors === null) {
                                vErrors = [err227];
                              } else {
                                vErrors.push(err227);
                              }
                              errors++;
                            }
                          }
                          if (data105.axes !== void 0) {
                            let data106 = data105.axes;
                            if (Array.isArray(data106)) {
                              const len35 = data106.length;
                              for (let i35 = 0; i35 < len35; i35++) {
                                if (typeof data106[i35] !== "string") {
                                  const err228 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/axes/" + i35, schemaPath: "#/properties/passes/items/properties/nodes/items/properties/axes/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                                  if (vErrors === null) {
                                    vErrors = [err228];
                                  } else {
                                    vErrors.push(err228);
                                  }
                                  errors++;
                                }
                              }
                            } else {
                              const err229 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/axes", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/axes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                              if (vErrors === null) {
                                vErrors = [err229];
                              } else {
                                vErrors.push(err229);
                              }
                              errors++;
                            }
                          }
                          if (data105.dtype !== void 0) {
                            if (typeof data105.dtype !== "string") {
                              const err230 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/dtype", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/dtype/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                              if (vErrors === null) {
                                vErrors = [err230];
                              } else {
                                vErrors.push(err230);
                              }
                              errors++;
                            }
                          }
                          if (data105.formula !== void 0) {
                            if (typeof data105.formula !== "string") {
                              const err231 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/formula", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/formula/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                              if (vErrors === null) {
                                vErrors = [err231];
                              } else {
                                vErrors.push(err231);
                              }
                              errors++;
                            }
                          }
                          if (data105.id !== void 0) {
                            if (typeof data105.id !== "string") {
                              const err232 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/id", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                              if (vErrors === null) {
                                vErrors = [err232];
                              } else {
                                vErrors.push(err232);
                              }
                              errors++;
                            }
                          }
                          if (data105.inputs !== void 0) {
                            let data111 = data105.inputs;
                            if (Array.isArray(data111)) {
                              const len36 = data111.length;
                              for (let i36 = 0; i36 < len36; i36++) {
                                if (typeof data111[i36] !== "string") {
                                  const err233 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/inputs/" + i36, schemaPath: "#/properties/passes/items/properties/nodes/items/properties/inputs/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                                  if (vErrors === null) {
                                    vErrors = [err233];
                                  } else {
                                    vErrors.push(err233);
                                  }
                                  errors++;
                                }
                              }
                            } else {
                              const err234 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/inputs", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/inputs/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                              if (vErrors === null) {
                                vErrors = [err234];
                              } else {
                                vErrors.push(err234);
                              }
                              errors++;
                            }
                          }
                          if (data105.layer !== void 0) {
                            let data113 = data105.layer;
                            if (!(typeof data113 == "number" && (!(data113 % 1) && !isNaN(data113)) && isFinite(data113)) && data113 !== null) {
                              const err235 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/layer", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/layer/type", keyword: "type", params: { type: schema63.properties.passes.items.properties.nodes.items.properties.layer.type }, message: "must be integer,null" };
                              if (vErrors === null) {
                                vErrors = [err235];
                              } else {
                                vErrors.push(err235);
                              }
                              errors++;
                            }
                          }
                          if (data105.name !== void 0) {
                            if (typeof data105.name !== "string") {
                              const err236 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/name", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                              if (vErrors === null) {
                                vErrors = [err236];
                              } else {
                                vErrors.push(err236);
                              }
                              errors++;
                            }
                          }
                          if (data105.positions !== void 0) {
                            let data115 = data105.positions;
                            if (Array.isArray(data115)) {
                              const len37 = data115.length;
                              for (let i37 = 0; i37 < len37; i37++) {
                                let data116 = data115[i37];
                                if (!(typeof data116 == "number" && (!(data116 % 1) && !isNaN(data116)) && isFinite(data116))) {
                                  const err237 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/positions/" + i37, schemaPath: "#/properties/passes/items/properties/nodes/items/properties/positions/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                  if (vErrors === null) {
                                    vErrors = [err237];
                                  } else {
                                    vErrors.push(err237);
                                  }
                                  errors++;
                                }
                              }
                            } else {
                              const err238 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/positions", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/positions/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                              if (vErrors === null) {
                                vErrors = [err238];
                              } else {
                                vErrors.push(err238);
                              }
                              errors++;
                            }
                          }
                          if (data105.request_id !== void 0) {
                            if (typeof data105.request_id !== "string") {
                              const err239 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/request_id", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/request_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                              if (vErrors === null) {
                                vErrors = [err239];
                              } else {
                                vErrors.push(err239);
                              }
                              errors++;
                            }
                          }
                          if (data105.run_id !== void 0) {
                            if (typeof data105.run_id !== "string") {
                              const err240 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/run_id", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/run_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                              if (vErrors === null) {
                                vErrors = [err240];
                              } else {
                                vErrors.push(err240);
                              }
                              errors++;
                            }
                          }
                          if (data105.shape !== void 0) {
                            let data119 = data105.shape;
                            if (Array.isArray(data119)) {
                              const len38 = data119.length;
                              for (let i38 = 0; i38 < len38; i38++) {
                                let data120 = data119[i38];
                                if (!(typeof data120 == "number" && (!(data120 % 1) && !isNaN(data120)) && isFinite(data120))) {
                                  const err241 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/shape/" + i38, schemaPath: "#/properties/passes/items/properties/nodes/items/properties/shape/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                  if (vErrors === null) {
                                    vErrors = [err241];
                                  } else {
                                    vErrors.push(err241);
                                  }
                                  errors++;
                                }
                              }
                            } else {
                              const err242 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/shape", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/shape/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                              if (vErrors === null) {
                                vErrors = [err242];
                              } else {
                                vErrors.push(err242);
                              }
                              errors++;
                            }
                          }
                          if (data105.step !== void 0) {
                            let data121 = data105.step;
                            if (!(typeof data121 == "number" && (!(data121 % 1) && !isNaN(data121)) && isFinite(data121))) {
                              const err243 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/step", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/step/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                              if (vErrors === null) {
                                vErrors = [err243];
                              } else {
                                vErrors.push(err243);
                              }
                              errors++;
                            }
                          }
                          if (data105.term !== void 0) {
                            if (typeof data105.term !== "string") {
                              const err244 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/term", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/term/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                              if (vErrors === null) {
                                vErrors = [err244];
                              } else {
                                vErrors.push(err244);
                              }
                              errors++;
                            }
                          }
                          if (data105.values !== void 0) {
                            let data123 = data105.values;
                            if (Array.isArray(data123)) {
                              const len39 = data123.length;
                              for (let i39 = 0; i39 < len39; i39++) {
                                let data124 = data123[i39];
                                const _errs262 = errors;
                                let valid93 = false;
                                const _errs263 = errors;
                                if (!(typeof data124 == "number" && isFinite(data124))) {
                                  const err245 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/values/" + i39, schemaPath: "#/properties/passes/items/properties/nodes/items/properties/values/items/anyOf/0/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                                  if (vErrors === null) {
                                    vErrors = [err245];
                                  } else {
                                    vErrors.push(err245);
                                  }
                                  errors++;
                                }
                                var _valid0 = _errs263 === errors;
                                valid93 = valid93 || _valid0;
                                const _errs265 = errors;
                                if (typeof data124 !== "boolean") {
                                  const err246 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/values/" + i39, schemaPath: "#/properties/passes/items/properties/nodes/items/properties/values/items/anyOf/1/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
                                  if (vErrors === null) {
                                    vErrors = [err246];
                                  } else {
                                    vErrors.push(err246);
                                  }
                                  errors++;
                                }
                                var _valid0 = _errs265 === errors;
                                valid93 = valid93 || _valid0;
                                const _errs267 = errors;
                                if (Array.isArray(data124)) {
                                  const len40 = data124.length;
                                  for (let i40 = 0; i40 < len40; i40++) {
                                    let data125 = data124[i40];
                                    if (!(typeof data125 == "number" && isFinite(data125)) && typeof data125 !== "boolean") {
                                      const err247 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/values/" + i39 + "/" + i40, schemaPath: "#/properties/passes/items/properties/nodes/items/properties/values/items/anyOf/2/items/type", keyword: "type", params: { type: schema63.properties.passes.items.properties.nodes.items.properties.values.items.anyOf[2].items.type }, message: "must be number,boolean" };
                                      if (vErrors === null) {
                                        vErrors = [err247];
                                      } else {
                                        vErrors.push(err247);
                                      }
                                      errors++;
                                    }
                                  }
                                } else {
                                  const err248 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/values/" + i39, schemaPath: "#/properties/passes/items/properties/nodes/items/properties/values/items/anyOf/2/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                                  if (vErrors === null) {
                                    vErrors = [err248];
                                  } else {
                                    vErrors.push(err248);
                                  }
                                  errors++;
                                }
                                var _valid0 = _errs267 === errors;
                                valid93 = valid93 || _valid0;
                                if (!valid93) {
                                  const err249 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/values/" + i39, schemaPath: "#/properties/passes/items/properties/nodes/items/properties/values/items/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                  if (vErrors === null) {
                                    vErrors = [err249];
                                  } else {
                                    vErrors.push(err249);
                                  }
                                  errors++;
                                } else {
                                  errors = _errs262;
                                  if (vErrors !== null) {
                                    if (_errs262) {
                                      vErrors.length = _errs262;
                                    } else {
                                      vErrors = null;
                                    }
                                  }
                                }
                              }
                            } else {
                              const err250 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34 + "/values", schemaPath: "#/properties/passes/items/properties/nodes/items/properties/values/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                              if (vErrors === null) {
                                vErrors = [err250];
                              } else {
                                vErrors.push(err250);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err251 = { instancePath: instancePath + "/passes/" + i32 + "/nodes/" + i34, schemaPath: "#/properties/passes/items/properties/nodes/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                          if (vErrors === null) {
                            vErrors = [err251];
                          } else {
                            vErrors.push(err251);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err252 = { instancePath: instancePath + "/passes/" + i32 + "/nodes", schemaPath: "#/properties/passes/items/properties/nodes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err252];
                      } else {
                        vErrors.push(err252);
                      }
                      errors++;
                    }
                  }
                  if (data98.output_position !== void 0) {
                    let data126 = data98.output_position;
                    if (!(typeof data126 == "number" && (!(data126 % 1) && !isNaN(data126)) && isFinite(data126))) {
                      const err253 = { instancePath: instancePath + "/passes/" + i32 + "/output_position", schemaPath: "#/properties/passes/items/properties/output_position/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err253];
                      } else {
                        vErrors.push(err253);
                      }
                      errors++;
                    }
                  }
                  if (data98.phase !== void 0) {
                    if (typeof data98.phase !== "string") {
                      const err254 = { instancePath: instancePath + "/passes/" + i32 + "/phase", schemaPath: "#/properties/passes/items/properties/phase/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err254];
                      } else {
                        vErrors.push(err254);
                      }
                      errors++;
                    }
                  }
                  if (data98.positions !== void 0) {
                    let data128 = data98.positions;
                    if (Array.isArray(data128)) {
                      const len41 = data128.length;
                      for (let i41 = 0; i41 < len41; i41++) {
                        let data129 = data128[i41];
                        if (!(typeof data129 == "number" && (!(data129 % 1) && !isNaN(data129)) && isFinite(data129))) {
                          const err255 = { instancePath: instancePath + "/passes/" + i32 + "/positions/" + i41, schemaPath: "#/properties/passes/items/properties/positions/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                          if (vErrors === null) {
                            vErrors = [err255];
                          } else {
                            vErrors.push(err255);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err256 = { instancePath: instancePath + "/passes/" + i32 + "/positions", schemaPath: "#/properties/passes/items/properties/positions/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                      if (vErrors === null) {
                        vErrors = [err256];
                      } else {
                        vErrors.push(err256);
                      }
                      errors++;
                    }
                  }
                  if (data98.request_id !== void 0) {
                    if (typeof data98.request_id !== "string") {
                      const err257 = { instancePath: instancePath + "/passes/" + i32 + "/request_id", schemaPath: "#/properties/passes/items/properties/request_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err257];
                      } else {
                        vErrors.push(err257);
                      }
                      errors++;
                    }
                  }
                  if (data98.run_id !== void 0) {
                    if (typeof data98.run_id !== "string") {
                      const err258 = { instancePath: instancePath + "/passes/" + i32 + "/run_id", schemaPath: "#/properties/passes/items/properties/run_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err258];
                      } else {
                        vErrors.push(err258);
                      }
                      errors++;
                    }
                  }
                  if (data98.selection !== void 0) {
                    let data132 = data98.selection;
                    if (data132 && typeof data132 == "object" && !Array.isArray(data132)) {
                      if (data132.decoding === void 0) {
                        const err259 = { instancePath: instancePath + "/passes/" + i32 + "/selection", schemaPath: "#/properties/passes/items/properties/selection/required", keyword: "required", params: { missingProperty: "decoding" }, message: "must have required property 'decoding'" };
                        if (vErrors === null) {
                          vErrors = [err259];
                        } else {
                          vErrors.push(err259);
                        }
                        errors++;
                      }
                      if (data132.probabilities === void 0) {
                        const err260 = { instancePath: instancePath + "/passes/" + i32 + "/selection", schemaPath: "#/properties/passes/items/properties/selection/required", keyword: "required", params: { missingProperty: "probabilities" }, message: "must have required property 'probabilities'" };
                        if (vErrors === null) {
                          vErrors = [err260];
                        } else {
                          vErrors.push(err260);
                        }
                        errors++;
                      }
                      if (data132.raw_logits === void 0) {
                        const err261 = { instancePath: instancePath + "/passes/" + i32 + "/selection", schemaPath: "#/properties/passes/items/properties/selection/required", keyword: "required", params: { missingProperty: "raw_logits" }, message: "must have required property 'raw_logits'" };
                        if (vErrors === null) {
                          vErrors = [err261];
                        } else {
                          vErrors.push(err261);
                        }
                        errors++;
                      }
                      if (data132.rng_state === void 0) {
                        const err262 = { instancePath: instancePath + "/passes/" + i32 + "/selection", schemaPath: "#/properties/passes/items/properties/selection/required", keyword: "required", params: { missingProperty: "rng_state" }, message: "must have required property 'rng_state'" };
                        if (vErrors === null) {
                          vErrors = [err262];
                        } else {
                          vErrors.push(err262);
                        }
                        errors++;
                      }
                      if (data132.rule === void 0) {
                        const err263 = { instancePath: instancePath + "/passes/" + i32 + "/selection", schemaPath: "#/properties/passes/items/properties/selection/required", keyword: "required", params: { missingProperty: "rule" }, message: "must have required property 'rule'" };
                        if (vErrors === null) {
                          vErrors = [err263];
                        } else {
                          vErrors.push(err263);
                        }
                        errors++;
                      }
                      if (data132.selected_id === void 0) {
                        const err264 = { instancePath: instancePath + "/passes/" + i32 + "/selection", schemaPath: "#/properties/passes/items/properties/selection/required", keyword: "required", params: { missingProperty: "selected_id" }, message: "must have required property 'selected_id'" };
                        if (vErrors === null) {
                          vErrors = [err264];
                        } else {
                          vErrors.push(err264);
                        }
                        errors++;
                      }
                      for (const key11 in data132) {
                        if (!(key11 === "decoding" || key11 === "probabilities" || key11 === "raw_logits" || key11 === "rng_state" || key11 === "rule" || key11 === "selected_id")) {
                          const err265 = { instancePath: instancePath + "/passes/" + i32 + "/selection", schemaPath: "#/properties/passes/items/properties/selection/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key11 }, message: "must NOT have additional properties" };
                          if (vErrors === null) {
                            vErrors = [err265];
                          } else {
                            vErrors.push(err265);
                          }
                          errors++;
                        }
                      }
                      if (data132.decoding !== void 0) {
                        if (typeof data132.decoding !== "string") {
                          const err266 = { instancePath: instancePath + "/passes/" + i32 + "/selection/decoding", schemaPath: "#/properties/passes/items/properties/selection/properties/decoding/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                          if (vErrors === null) {
                            vErrors = [err266];
                          } else {
                            vErrors.push(err266);
                          }
                          errors++;
                        }
                      }
                      if (data132.probabilities !== void 0) {
                        let data134 = data132.probabilities;
                        if (Array.isArray(data134)) {
                          const len42 = data134.length;
                          for (let i42 = 0; i42 < len42; i42++) {
                            let data135 = data134[i42];
                            if (!(typeof data135 == "number" && isFinite(data135))) {
                              const err267 = { instancePath: instancePath + "/passes/" + i32 + "/selection/probabilities/" + i42, schemaPath: "#/properties/passes/items/properties/selection/properties/probabilities/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                              if (vErrors === null) {
                                vErrors = [err267];
                              } else {
                                vErrors.push(err267);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err268 = { instancePath: instancePath + "/passes/" + i32 + "/selection/probabilities", schemaPath: "#/properties/passes/items/properties/selection/properties/probabilities/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err268];
                          } else {
                            vErrors.push(err268);
                          }
                          errors++;
                        }
                      }
                      if (data132.raw_logits !== void 0) {
                        let data136 = data132.raw_logits;
                        if (Array.isArray(data136)) {
                          const len43 = data136.length;
                          for (let i43 = 0; i43 < len43; i43++) {
                            let data137 = data136[i43];
                            if (!(typeof data137 == "number" && isFinite(data137))) {
                              const err269 = { instancePath: instancePath + "/passes/" + i32 + "/selection/raw_logits/" + i43, schemaPath: "#/properties/passes/items/properties/selection/properties/raw_logits/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                              if (vErrors === null) {
                                vErrors = [err269];
                              } else {
                                vErrors.push(err269);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err270 = { instancePath: instancePath + "/passes/" + i32 + "/selection/raw_logits", schemaPath: "#/properties/passes/items/properties/selection/properties/raw_logits/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err270];
                          } else {
                            vErrors.push(err270);
                          }
                          errors++;
                        }
                      }
                      if (data132.rng_state !== void 0) {
                        if (data132.rng_state !== null) {
                          const err271 = { instancePath: instancePath + "/passes/" + i32 + "/selection/rng_state", schemaPath: "#/properties/passes/items/properties/selection/properties/rng_state/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                          if (vErrors === null) {
                            vErrors = [err271];
                          } else {
                            vErrors.push(err271);
                          }
                          errors++;
                        }
                      }
                      if (data132.rule !== void 0) {
                        let data139 = data132.rule;
                        if (typeof data139 !== "string") {
                          const err272 = { instancePath: instancePath + "/passes/" + i32 + "/selection/rule", schemaPath: "#/properties/passes/items/properties/selection/properties/rule/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                          if (vErrors === null) {
                            vErrors = [err272];
                          } else {
                            vErrors.push(err272);
                          }
                          errors++;
                        }
                        if ("unmasked-greedy-v1" !== data139) {
                          const err273 = { instancePath: instancePath + "/passes/" + i32 + "/selection/rule", schemaPath: "#/properties/passes/items/properties/selection/properties/rule/const", keyword: "const", params: { allowedValue: "unmasked-greedy-v1" }, message: "must be equal to constant" };
                          if (vErrors === null) {
                            vErrors = [err273];
                          } else {
                            vErrors.push(err273);
                          }
                          errors++;
                        }
                      }
                      if (data132.selected_id !== void 0) {
                        let data140 = data132.selected_id;
                        if (!(typeof data140 == "number" && (!(data140 % 1) && !isNaN(data140)) && isFinite(data140))) {
                          const err274 = { instancePath: instancePath + "/passes/" + i32 + "/selection/selected_id", schemaPath: "#/properties/passes/items/properties/selection/properties/selected_id/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                          if (vErrors === null) {
                            vErrors = [err274];
                          } else {
                            vErrors.push(err274);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err275 = { instancePath: instancePath + "/passes/" + i32 + "/selection", schemaPath: "#/properties/passes/items/properties/selection/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                      if (vErrors === null) {
                        vErrors = [err275];
                      } else {
                        vErrors.push(err275);
                      }
                      errors++;
                    }
                  }
                  if (data98.selection_position !== void 0) {
                    let data141 = data98.selection_position;
                    if (!(typeof data141 == "number" && (!(data141 % 1) && !isNaN(data141)) && isFinite(data141))) {
                      const err276 = { instancePath: instancePath + "/passes/" + i32 + "/selection_position", schemaPath: "#/properties/passes/items/properties/selection_position/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err276];
                      } else {
                        vErrors.push(err276);
                      }
                      errors++;
                    }
                  }
                  if (data98.step !== void 0) {
                    let data142 = data98.step;
                    if (!(typeof data142 == "number" && (!(data142 % 1) && !isNaN(data142)) && isFinite(data142))) {
                      const err277 = { instancePath: instancePath + "/passes/" + i32 + "/step", schemaPath: "#/properties/passes/items/properties/step/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err277];
                      } else {
                        vErrors.push(err277);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err278 = { instancePath: instancePath + "/passes/" + i32, schemaPath: "#/properties/passes/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                  if (vErrors === null) {
                    vErrors = [err278];
                  } else {
                    vErrors.push(err278);
                  }
                  errors++;
                }
              }
            } else {
              const err279 = { instancePath: instancePath + "/passes", schemaPath: "#/properties/passes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
              if (vErrors === null) {
                vErrors = [err279];
              } else {
                vErrors.push(err279);
              }
              errors++;
            }
          }
          if (data.precision !== void 0) {
            let data143 = data.precision;
            if (data143 && typeof data143 == "object" && !Array.isArray(data143)) {
              if (data143.accumulation === void 0) {
                const err280 = { instancePath: instancePath + "/precision", schemaPath: "#/properties/precision/required", keyword: "required", params: { missingProperty: "accumulation" }, message: "must have required property 'accumulation'" };
                if (vErrors === null) {
                  vErrors = [err280];
                } else {
                  vErrors.push(err280);
                }
                errors++;
              }
              if (data143.compute === void 0) {
                const err281 = { instancePath: instancePath + "/precision", schemaPath: "#/properties/precision/required", keyword: "required", params: { missingProperty: "compute" }, message: "must have required property 'compute'" };
                if (vErrors === null) {
                  vErrors = [err281];
                } else {
                  vErrors.push(err281);
                }
                errors++;
              }
              if (data143.storage === void 0) {
                const err282 = { instancePath: instancePath + "/precision", schemaPath: "#/properties/precision/required", keyword: "required", params: { missingProperty: "storage" }, message: "must have required property 'storage'" };
                if (vErrors === null) {
                  vErrors = [err282];
                } else {
                  vErrors.push(err282);
                }
                errors++;
              }
              for (const key12 in data143) {
                if (!(key12 === "accumulation" || key12 === "compute" || key12 === "storage")) {
                  const err283 = { instancePath: instancePath + "/precision", schemaPath: "#/properties/precision/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key12 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err283];
                  } else {
                    vErrors.push(err283);
                  }
                  errors++;
                }
              }
              if (data143.accumulation !== void 0) {
                if (typeof data143.accumulation !== "string") {
                  const err284 = { instancePath: instancePath + "/precision/accumulation", schemaPath: "#/properties/precision/properties/accumulation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err284];
                  } else {
                    vErrors.push(err284);
                  }
                  errors++;
                }
              }
              if (data143.compute !== void 0) {
                if (typeof data143.compute !== "string") {
                  const err285 = { instancePath: instancePath + "/precision/compute", schemaPath: "#/properties/precision/properties/compute/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err285];
                  } else {
                    vErrors.push(err285);
                  }
                  errors++;
                }
              }
              if (data143.storage !== void 0) {
                if (typeof data143.storage !== "string") {
                  const err286 = { instancePath: instancePath + "/precision/storage", schemaPath: "#/properties/precision/properties/storage/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err286];
                  } else {
                    vErrors.push(err286);
                  }
                  errors++;
                }
              }
            } else {
              const err287 = { instancePath: instancePath + "/precision", schemaPath: "#/properties/precision/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err287];
              } else {
                vErrors.push(err287);
              }
              errors++;
            }
          }
          if (data.request_id !== void 0) {
            if (typeof data.request_id !== "string") {
              const err288 = { instancePath: instancePath + "/request_id", schemaPath: "#/properties/request_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err288];
              } else {
                vErrors.push(err288);
              }
              errors++;
            }
          }
          if (data.sequence_ids !== void 0) {
            let data148 = data.sequence_ids;
            if (Array.isArray(data148)) {
              const len44 = data148.length;
              for (let i44 = 0; i44 < len44; i44++) {
                let data149 = data148[i44];
                if (!(typeof data149 == "number" && (!(data149 % 1) && !isNaN(data149)) && isFinite(data149))) {
                  const err289 = { instancePath: instancePath + "/sequence_ids/" + i44, schemaPath: "#/properties/sequence_ids/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                  if (vErrors === null) {
                    vErrors = [err289];
                  } else {
                    vErrors.push(err289);
                  }
                  errors++;
                }
              }
            } else {
              const err290 = { instancePath: instancePath + "/sequence_ids", schemaPath: "#/properties/sequence_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
              if (vErrors === null) {
                vErrors = [err290];
              } else {
                vErrors.push(err290);
              }
              errors++;
            }
          }
          if (data.tokenizer !== void 0) {
            let data150 = data.tokenizer;
            if (data150 && typeof data150 == "object" && !Array.isArray(data150)) {
              if (data150.codec_version === void 0) {
                const err291 = { instancePath: instancePath + "/tokenizer", schemaPath: "#/properties/tokenizer/required", keyword: "required", params: { missingProperty: "codec_version" }, message: "must have required property 'codec_version'" };
                if (vErrors === null) {
                  vErrors = [err291];
                } else {
                  vErrors.push(err291);
                }
                errors++;
              }
              if (data150.context_limit === void 0) {
                const err292 = { instancePath: instancePath + "/tokenizer", schemaPath: "#/properties/tokenizer/required", keyword: "required", params: { missingProperty: "context_limit" }, message: "must have required property 'context_limit'" };
                if (vErrors === null) {
                  vErrors = [err292];
                } else {
                  vErrors.push(err292);
                }
                errors++;
              }
              if (data150.ids === void 0) {
                const err293 = { instancePath: instancePath + "/tokenizer", schemaPath: "#/properties/tokenizer/required", keyword: "required", params: { missingProperty: "ids" }, message: "must have required property 'ids'" };
                if (vErrors === null) {
                  vErrors = [err293];
                } else {
                  vErrors.push(err293);
                }
                errors++;
              }
              if (data150.input_kind === void 0) {
                const err294 = { instancePath: instancePath + "/tokenizer", schemaPath: "#/properties/tokenizer/required", keyword: "required", params: { missingProperty: "input_kind" }, message: "must have required property 'input_kind'" };
                if (vErrors === null) {
                  vErrors = [err294];
                } else {
                  vErrors.push(err294);
                }
                errors++;
              }
              if (data150.input_sha256 === void 0) {
                const err295 = { instancePath: instancePath + "/tokenizer", schemaPath: "#/properties/tokenizer/required", keyword: "required", params: { missingProperty: "input_sha256" }, message: "must have required property 'input_sha256'" };
                if (vErrors === null) {
                  vErrors = [err295];
                } else {
                  vErrors.push(err295);
                }
                errors++;
              }
              if (data150.manifest_sha256 === void 0) {
                const err296 = { instancePath: instancePath + "/tokenizer", schemaPath: "#/properties/tokenizer/required", keyword: "required", params: { missingProperty: "manifest_sha256" }, message: "must have required property 'manifest_sha256'" };
                if (vErrors === null) {
                  vErrors = [err296];
                } else {
                  vErrors.push(err296);
                }
                errors++;
              }
              if (data150.spans === void 0) {
                const err297 = { instancePath: instancePath + "/tokenizer", schemaPath: "#/properties/tokenizer/required", keyword: "required", params: { missingProperty: "spans" }, message: "must have required property 'spans'" };
                if (vErrors === null) {
                  vErrors = [err297];
                } else {
                  vErrors.push(err297);
                }
                errors++;
              }
              if (data150.unicode_version === void 0) {
                const err298 = { instancePath: instancePath + "/tokenizer", schemaPath: "#/properties/tokenizer/required", keyword: "required", params: { missingProperty: "unicode_version" }, message: "must have required property 'unicode_version'" };
                if (vErrors === null) {
                  vErrors = [err298];
                } else {
                  vErrors.push(err298);
                }
                errors++;
              }
              for (const key13 in data150) {
                if (!(key13 === "codec_version" || key13 === "context_limit" || key13 === "ids" || key13 === "input_kind" || key13 === "input_sha256" || key13 === "manifest_sha256" || key13 === "spans" || key13 === "unicode_version")) {
                  const err299 = { instancePath: instancePath + "/tokenizer", schemaPath: "#/properties/tokenizer/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key13 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err299];
                  } else {
                    vErrors.push(err299);
                  }
                  errors++;
                }
              }
              if (data150.codec_version !== void 0) {
                if (typeof data150.codec_version !== "string") {
                  const err300 = { instancePath: instancePath + "/tokenizer/codec_version", schemaPath: "#/properties/tokenizer/properties/codec_version/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err300];
                  } else {
                    vErrors.push(err300);
                  }
                  errors++;
                }
              }
              if (data150.context_limit !== void 0) {
                let data152 = data150.context_limit;
                if (!(typeof data152 == "number" && (!(data152 % 1) && !isNaN(data152)) && isFinite(data152)) && data152 !== null) {
                  const err301 = { instancePath: instancePath + "/tokenizer/context_limit", schemaPath: "#/properties/tokenizer/properties/context_limit/type", keyword: "type", params: { type: schema63.properties.tokenizer.properties.context_limit.type }, message: "must be integer,null" };
                  if (vErrors === null) {
                    vErrors = [err301];
                  } else {
                    vErrors.push(err301);
                  }
                  errors++;
                }
              }
              if (data150.ids !== void 0) {
                let data153 = data150.ids;
                if (Array.isArray(data153)) {
                  const len45 = data153.length;
                  for (let i45 = 0; i45 < len45; i45++) {
                    let data154 = data153[i45];
                    if (!(typeof data154 == "number" && (!(data154 % 1) && !isNaN(data154)) && isFinite(data154))) {
                      const err302 = { instancePath: instancePath + "/tokenizer/ids/" + i45, schemaPath: "#/properties/tokenizer/properties/ids/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err302];
                      } else {
                        vErrors.push(err302);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err303 = { instancePath: instancePath + "/tokenizer/ids", schemaPath: "#/properties/tokenizer/properties/ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                  if (vErrors === null) {
                    vErrors = [err303];
                  } else {
                    vErrors.push(err303);
                  }
                  errors++;
                }
              }
              if (data150.input_kind !== void 0) {
                if (typeof data150.input_kind !== "string") {
                  const err304 = { instancePath: instancePath + "/tokenizer/input_kind", schemaPath: "#/properties/tokenizer/properties/input_kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err304];
                  } else {
                    vErrors.push(err304);
                  }
                  errors++;
                }
              }
              if (data150.input_sha256 !== void 0) {
                if (typeof data150.input_sha256 !== "string") {
                  const err305 = { instancePath: instancePath + "/tokenizer/input_sha256", schemaPath: "#/properties/tokenizer/properties/input_sha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err305];
                  } else {
                    vErrors.push(err305);
                  }
                  errors++;
                }
              }
              if (data150.manifest_sha256 !== void 0) {
                if (typeof data150.manifest_sha256 !== "string") {
                  const err306 = { instancePath: instancePath + "/tokenizer/manifest_sha256", schemaPath: "#/properties/tokenizer/properties/manifest_sha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err306];
                  } else {
                    vErrors.push(err306);
                  }
                  errors++;
                }
              }
              if (data150.spans !== void 0) {
                let data158 = data150.spans;
                if (Array.isArray(data158)) {
                  const len46 = data158.length;
                  for (let i46 = 0; i46 < len46; i46++) {
                    let data159 = data158[i46];
                    if (data159 && typeof data159 == "object" && !Array.isArray(data159)) {
                      if (data159.byte_end === void 0) {
                        const err307 = { instancePath: instancePath + "/tokenizer/spans/" + i46, schemaPath: "#/properties/tokenizer/properties/spans/items/required", keyword: "required", params: { missingProperty: "byte_end" }, message: "must have required property 'byte_end'" };
                        if (vErrors === null) {
                          vErrors = [err307];
                        } else {
                          vErrors.push(err307);
                        }
                        errors++;
                      }
                      if (data159.byte_start === void 0) {
                        const err308 = { instancePath: instancePath + "/tokenizer/spans/" + i46, schemaPath: "#/properties/tokenizer/properties/spans/items/required", keyword: "required", params: { missingProperty: "byte_start" }, message: "must have required property 'byte_start'" };
                        if (vErrors === null) {
                          vErrors = [err308];
                        } else {
                          vErrors.push(err308);
                        }
                        errors++;
                      }
                      if (data159.ids === void 0) {
                        const err309 = { instancePath: instancePath + "/tokenizer/spans/" + i46, schemaPath: "#/properties/tokenizer/properties/spans/items/required", keyword: "required", params: { missingProperty: "ids" }, message: "must have required property 'ids'" };
                        if (vErrors === null) {
                          vErrors = [err309];
                        } else {
                          vErrors.push(err309);
                        }
                        errors++;
                      }
                      if (data159.kind === void 0) {
                        const err310 = { instancePath: instancePath + "/tokenizer/spans/" + i46, schemaPath: "#/properties/tokenizer/properties/spans/items/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                        if (vErrors === null) {
                          vErrors = [err310];
                        } else {
                          vErrors.push(err310);
                        }
                        errors++;
                      }
                      if (data159.raw_bytes === void 0) {
                        const err311 = { instancePath: instancePath + "/tokenizer/spans/" + i46, schemaPath: "#/properties/tokenizer/properties/spans/items/required", keyword: "required", params: { missingProperty: "raw_bytes" }, message: "must have required property 'raw_bytes'" };
                        if (vErrors === null) {
                          vErrors = [err311];
                        } else {
                          vErrors.push(err311);
                        }
                        errors++;
                      }
                      if (data159.reason === void 0) {
                        const err312 = { instancePath: instancePath + "/tokenizer/spans/" + i46, schemaPath: "#/properties/tokenizer/properties/spans/items/required", keyword: "required", params: { missingProperty: "reason" }, message: "must have required property 'reason'" };
                        if (vErrors === null) {
                          vErrors = [err312];
                        } else {
                          vErrors.push(err312);
                        }
                        errors++;
                      }
                      if (data159.token_end === void 0) {
                        const err313 = { instancePath: instancePath + "/tokenizer/spans/" + i46, schemaPath: "#/properties/tokenizer/properties/spans/items/required", keyword: "required", params: { missingProperty: "token_end" }, message: "must have required property 'token_end'" };
                        if (vErrors === null) {
                          vErrors = [err313];
                        } else {
                          vErrors.push(err313);
                        }
                        errors++;
                      }
                      if (data159.token_start === void 0) {
                        const err314 = { instancePath: instancePath + "/tokenizer/spans/" + i46, schemaPath: "#/properties/tokenizer/properties/spans/items/required", keyword: "required", params: { missingProperty: "token_start" }, message: "must have required property 'token_start'" };
                        if (vErrors === null) {
                          vErrors = [err314];
                        } else {
                          vErrors.push(err314);
                        }
                        errors++;
                      }
                      if (data159.turn === void 0) {
                        const err315 = { instancePath: instancePath + "/tokenizer/spans/" + i46, schemaPath: "#/properties/tokenizer/properties/spans/items/required", keyword: "required", params: { missingProperty: "turn" }, message: "must have required property 'turn'" };
                        if (vErrors === null) {
                          vErrors = [err315];
                        } else {
                          vErrors.push(err315);
                        }
                        errors++;
                      }
                      for (const key14 in data159) {
                        if (!func1.call(schema63.properties.tokenizer.properties.spans.items.properties, key14)) {
                          const err316 = { instancePath: instancePath + "/tokenizer/spans/" + i46, schemaPath: "#/properties/tokenizer/properties/spans/items/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key14 }, message: "must NOT have additional properties" };
                          if (vErrors === null) {
                            vErrors = [err316];
                          } else {
                            vErrors.push(err316);
                          }
                          errors++;
                        }
                      }
                      if (data159.byte_end !== void 0) {
                        let data160 = data159.byte_end;
                        if (!(typeof data160 == "number" && (!(data160 % 1) && !isNaN(data160)) && isFinite(data160)) && data160 !== null) {
                          const err317 = { instancePath: instancePath + "/tokenizer/spans/" + i46 + "/byte_end", schemaPath: "#/properties/tokenizer/properties/spans/items/properties/byte_end/type", keyword: "type", params: { type: schema63.properties.tokenizer.properties.spans.items.properties.byte_end.type }, message: "must be integer,null" };
                          if (vErrors === null) {
                            vErrors = [err317];
                          } else {
                            vErrors.push(err317);
                          }
                          errors++;
                        }
                      }
                      if (data159.byte_start !== void 0) {
                        let data161 = data159.byte_start;
                        if (!(typeof data161 == "number" && (!(data161 % 1) && !isNaN(data161)) && isFinite(data161)) && data161 !== null) {
                          const err318 = { instancePath: instancePath + "/tokenizer/spans/" + i46 + "/byte_start", schemaPath: "#/properties/tokenizer/properties/spans/items/properties/byte_start/type", keyword: "type", params: { type: schema63.properties.tokenizer.properties.spans.items.properties.byte_start.type }, message: "must be integer,null" };
                          if (vErrors === null) {
                            vErrors = [err318];
                          } else {
                            vErrors.push(err318);
                          }
                          errors++;
                        }
                      }
                      if (data159.ids !== void 0) {
                        let data162 = data159.ids;
                        if (Array.isArray(data162)) {
                          const len47 = data162.length;
                          for (let i47 = 0; i47 < len47; i47++) {
                            let data163 = data162[i47];
                            if (!(typeof data163 == "number" && (!(data163 % 1) && !isNaN(data163)) && isFinite(data163))) {
                              const err319 = { instancePath: instancePath + "/tokenizer/spans/" + i46 + "/ids/" + i47, schemaPath: "#/properties/tokenizer/properties/spans/items/properties/ids/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                              if (vErrors === null) {
                                vErrors = [err319];
                              } else {
                                vErrors.push(err319);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err320 = { instancePath: instancePath + "/tokenizer/spans/" + i46 + "/ids", schemaPath: "#/properties/tokenizer/properties/spans/items/properties/ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err320];
                          } else {
                            vErrors.push(err320);
                          }
                          errors++;
                        }
                      }
                      if (data159.kind !== void 0) {
                        if (typeof data159.kind !== "string") {
                          const err321 = { instancePath: instancePath + "/tokenizer/spans/" + i46 + "/kind", schemaPath: "#/properties/tokenizer/properties/spans/items/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                          if (vErrors === null) {
                            vErrors = [err321];
                          } else {
                            vErrors.push(err321);
                          }
                          errors++;
                        }
                      }
                      if (data159.raw_bytes !== void 0) {
                        let data165 = data159.raw_bytes;
                        if (Array.isArray(data165)) {
                          const len48 = data165.length;
                          for (let i48 = 0; i48 < len48; i48++) {
                            let data166 = data165[i48];
                            if (!(typeof data166 == "number" && (!(data166 % 1) && !isNaN(data166)) && isFinite(data166))) {
                              const err322 = { instancePath: instancePath + "/tokenizer/spans/" + i46 + "/raw_bytes/" + i48, schemaPath: "#/properties/tokenizer/properties/spans/items/properties/raw_bytes/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                              if (vErrors === null) {
                                vErrors = [err322];
                              } else {
                                vErrors.push(err322);
                              }
                              errors++;
                            }
                          }
                        } else {
                          const err323 = { instancePath: instancePath + "/tokenizer/spans/" + i46 + "/raw_bytes", schemaPath: "#/properties/tokenizer/properties/spans/items/properties/raw_bytes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                          if (vErrors === null) {
                            vErrors = [err323];
                          } else {
                            vErrors.push(err323);
                          }
                          errors++;
                        }
                      }
                      if (data159.reason !== void 0) {
                        if (typeof data159.reason !== "string") {
                          const err324 = { instancePath: instancePath + "/tokenizer/spans/" + i46 + "/reason", schemaPath: "#/properties/tokenizer/properties/spans/items/properties/reason/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                          if (vErrors === null) {
                            vErrors = [err324];
                          } else {
                            vErrors.push(err324);
                          }
                          errors++;
                        }
                      }
                      if (data159.token_end !== void 0) {
                        let data168 = data159.token_end;
                        if (!(typeof data168 == "number" && (!(data168 % 1) && !isNaN(data168)) && isFinite(data168))) {
                          const err325 = { instancePath: instancePath + "/tokenizer/spans/" + i46 + "/token_end", schemaPath: "#/properties/tokenizer/properties/spans/items/properties/token_end/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                          if (vErrors === null) {
                            vErrors = [err325];
                          } else {
                            vErrors.push(err325);
                          }
                          errors++;
                        }
                      }
                      if (data159.token_start !== void 0) {
                        let data169 = data159.token_start;
                        if (!(typeof data169 == "number" && (!(data169 % 1) && !isNaN(data169)) && isFinite(data169))) {
                          const err326 = { instancePath: instancePath + "/tokenizer/spans/" + i46 + "/token_start", schemaPath: "#/properties/tokenizer/properties/spans/items/properties/token_start/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                          if (vErrors === null) {
                            vErrors = [err326];
                          } else {
                            vErrors.push(err326);
                          }
                          errors++;
                        }
                      }
                      if (data159.turn !== void 0) {
                        let data170 = data159.turn;
                        if (!(typeof data170 == "number" && (!(data170 % 1) && !isNaN(data170)) && isFinite(data170)) && data170 !== null) {
                          const err327 = { instancePath: instancePath + "/tokenizer/spans/" + i46 + "/turn", schemaPath: "#/properties/tokenizer/properties/spans/items/properties/turn/type", keyword: "type", params: { type: schema63.properties.tokenizer.properties.spans.items.properties.turn.type }, message: "must be integer,null" };
                          if (vErrors === null) {
                            vErrors = [err327];
                          } else {
                            vErrors.push(err327);
                          }
                          errors++;
                        }
                      }
                    } else {
                      const err328 = { instancePath: instancePath + "/tokenizer/spans/" + i46, schemaPath: "#/properties/tokenizer/properties/spans/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                      if (vErrors === null) {
                        vErrors = [err328];
                      } else {
                        vErrors.push(err328);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err329 = { instancePath: instancePath + "/tokenizer/spans", schemaPath: "#/properties/tokenizer/properties/spans/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                  if (vErrors === null) {
                    vErrors = [err329];
                  } else {
                    vErrors.push(err329);
                  }
                  errors++;
                }
              }
              if (data150.unicode_version !== void 0) {
                if (typeof data150.unicode_version !== "string") {
                  const err330 = { instancePath: instancePath + "/tokenizer/unicode_version", schemaPath: "#/properties/tokenizer/properties/unicode_version/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err330];
                  } else {
                    vErrors.push(err330);
                  }
                  errors++;
                }
              }
            } else {
              const err331 = { instancePath: instancePath + "/tokenizer", schemaPath: "#/properties/tokenizer/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err331];
              } else {
                vErrors.push(err331);
              }
              errors++;
            }
          }
          if (data.vocabulary !== void 0) {
            let data172 = data.vocabulary;
            if (Array.isArray(data172)) {
              const len49 = data172.length;
              for (let i49 = 0; i49 < len49; i49++) {
                let data173 = data172[i49];
                if (data173 && typeof data173 == "object" && !Array.isArray(data173)) {
                  if (data173.group === void 0) {
                    const err332 = { instancePath: instancePath + "/vocabulary/" + i49, schemaPath: "#/properties/vocabulary/items/required", keyword: "required", params: { missingProperty: "group" }, message: "must have required property 'group'" };
                    if (vErrors === null) {
                      vErrors = [err332];
                    } else {
                      vErrors.push(err332);
                    }
                    errors++;
                  }
                  if (data173.id === void 0) {
                    const err333 = { instancePath: instancePath + "/vocabulary/" + i49, schemaPath: "#/properties/vocabulary/items/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
                    if (vErrors === null) {
                      vErrors = [err333];
                    } else {
                      vErrors.push(err333);
                    }
                    errors++;
                  }
                  if (data173.kind === void 0) {
                    const err334 = { instancePath: instancePath + "/vocabulary/" + i49, schemaPath: "#/properties/vocabulary/items/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                    if (vErrors === null) {
                      vErrors = [err334];
                    } else {
                      vErrors.push(err334);
                    }
                    errors++;
                  }
                  if (data173.piece === void 0) {
                    const err335 = { instancePath: instancePath + "/vocabulary/" + i49, schemaPath: "#/properties/vocabulary/items/required", keyword: "required", params: { missingProperty: "piece" }, message: "must have required property 'piece'" };
                    if (vErrors === null) {
                      vErrors = [err335];
                    } else {
                      vErrors.push(err335);
                    }
                    errors++;
                  }
                  for (const key15 in data173) {
                    if (!(key15 === "group" || key15 === "id" || key15 === "kind" || key15 === "piece")) {
                      const err336 = { instancePath: instancePath + "/vocabulary/" + i49, schemaPath: "#/properties/vocabulary/items/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key15 }, message: "must NOT have additional properties" };
                      if (vErrors === null) {
                        vErrors = [err336];
                      } else {
                        vErrors.push(err336);
                      }
                      errors++;
                    }
                  }
                  if (data173.group !== void 0) {
                    if (typeof data173.group !== "string") {
                      const err337 = { instancePath: instancePath + "/vocabulary/" + i49 + "/group", schemaPath: "#/properties/vocabulary/items/properties/group/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err337];
                      } else {
                        vErrors.push(err337);
                      }
                      errors++;
                    }
                  }
                  if (data173.id !== void 0) {
                    let data175 = data173.id;
                    if (!(typeof data175 == "number" && (!(data175 % 1) && !isNaN(data175)) && isFinite(data175))) {
                      const err338 = { instancePath: instancePath + "/vocabulary/" + i49 + "/id", schemaPath: "#/properties/vocabulary/items/properties/id/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                      if (vErrors === null) {
                        vErrors = [err338];
                      } else {
                        vErrors.push(err338);
                      }
                      errors++;
                    }
                  }
                  if (data173.kind !== void 0) {
                    if (typeof data173.kind !== "string") {
                      const err339 = { instancePath: instancePath + "/vocabulary/" + i49 + "/kind", schemaPath: "#/properties/vocabulary/items/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err339];
                      } else {
                        vErrors.push(err339);
                      }
                      errors++;
                    }
                  }
                  if (data173.piece !== void 0) {
                    if (typeof data173.piece !== "string") {
                      const err340 = { instancePath: instancePath + "/vocabulary/" + i49 + "/piece", schemaPath: "#/properties/vocabulary/items/properties/piece/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                      if (vErrors === null) {
                        vErrors = [err340];
                      } else {
                        vErrors.push(err340);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err341 = { instancePath: instancePath + "/vocabulary/" + i49, schemaPath: "#/properties/vocabulary/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                  if (vErrors === null) {
                    vErrors = [err341];
                  } else {
                    vErrors.push(err341);
                  }
                  errors++;
                }
              }
            } else {
              const err342 = { instancePath: instancePath + "/vocabulary", schemaPath: "#/properties/vocabulary/type", keyword: "type", params: { type: "array" }, message: "must be array" };
              if (vErrors === null) {
                vErrors = [err342];
              } else {
                vErrors.push(err342);
              }
              errors++;
            }
          }
        } else {
          const err343 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err343];
          } else {
            vErrors.push(err343);
          }
          errors++;
        }
        validate48.errors = vErrors;
        return errors === 0;
      }
      validate48.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.RunRecord = validate50;
      function validate50(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate50.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.format === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "format" }, message: "must have required property 'format'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.id === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data.contract_sha256 === void 0) {
            const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "contract_sha256" }, message: "must have required property 'contract_sha256'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          if (data.declaration === void 0) {
            const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "declaration" }, message: "must have required property 'declaration'" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
          if (data.clock === void 0) {
            const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "clock" }, message: "must have required property 'clock'" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
          if (data.events === void 0) {
            const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "events" }, message: "must have required property 'events'" };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
          if (data.traces === void 0) {
            const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "traces" }, message: "must have required property 'traces'" };
            if (vErrors === null) {
              vErrors = [err6];
            } else {
              vErrors.push(err6);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "format" || key0 === "id" || key0 === "contract_sha256" || key0 === "declaration" || key0 === "clock" || key0 === "events" || key0 === "traces")) {
              const err7 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
          if (data.format !== void 0) {
            let data0 = data.format;
            if (typeof data0 !== "string") {
              const err8 = { instancePath: instancePath + "/format", schemaPath: "#/properties/format/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            if ("workload-run-v1" !== data0) {
              const err9 = { instancePath: instancePath + "/format", schemaPath: "#/properties/format/const", keyword: "const", params: { allowedValue: "workload-run-v1" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            }
          }
          if (data.id !== void 0) {
            let data1 = data.id;
            if (typeof data1 === "string") {
              if (!pattern4.test(data1)) {
                const err10 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{64}$" }, message: 'must match pattern "^[0-9a-f]{64}$"' };
                if (vErrors === null) {
                  vErrors = [err10];
                } else {
                  vErrors.push(err10);
                }
                errors++;
              }
            } else {
              const err11 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
          }
          if (data.contract_sha256 !== void 0) {
            let data2 = data.contract_sha256;
            if (typeof data2 === "string") {
              if (!pattern4.test(data2)) {
                const err12 = { instancePath: instancePath + "/contract_sha256", schemaPath: "#/properties/contract_sha256/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{64}$" }, message: 'must match pattern "^[0-9a-f]{64}$"' };
                if (vErrors === null) {
                  vErrors = [err12];
                } else {
                  vErrors.push(err12);
                }
                errors++;
              }
            } else {
              const err13 = { instancePath: instancePath + "/contract_sha256", schemaPath: "#/properties/contract_sha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
          }
          if (data.declaration !== void 0) {
            if (!validate35(data.declaration, { instancePath: instancePath + "/declaration", parentData: data, parentDataProperty: "declaration", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate35.errors : vErrors.concat(validate35.errors);
              errors = vErrors.length;
            }
          }
          if (data.clock !== void 0) {
            let data4 = data.clock;
            if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
              if (data4.kind === void 0) {
                const err14 = { instancePath: instancePath + "/clock", schemaPath: "#/$defs/EventClock/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                if (vErrors === null) {
                  vErrors = [err14];
                } else {
                  vErrors.push(err14);
                }
                errors++;
              }
              for (const key1 in data4) {
                if (!(key1 === "kind")) {
                  const err15 = { instancePath: instancePath + "/clock", schemaPath: "#/$defs/EventClock/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err15];
                  } else {
                    vErrors.push(err15);
                  }
                  errors++;
                }
              }
              if (data4.kind !== void 0) {
                let data5 = data4.kind;
                if (typeof data5 !== "string") {
                  const err16 = { instancePath: instancePath + "/clock/kind", schemaPath: "#/$defs/EventClock/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err16];
                  } else {
                    vErrors.push(err16);
                  }
                  errors++;
                }
                if ("execution-order" !== data5) {
                  const err17 = { instancePath: instancePath + "/clock/kind", schemaPath: "#/$defs/EventClock/properties/kind/const", keyword: "const", params: { allowedValue: "execution-order" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                }
              }
            } else {
              const err18 = { instancePath: instancePath + "/clock", schemaPath: "#/$defs/EventClock/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
          }
          if (data.events !== void 0) {
            let data6 = data.events;
            if (Array.isArray(data6)) {
              if (data6.length < 1) {
                const err19 = { instancePath: instancePath + "/events", schemaPath: "#/properties/events/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
              const len0 = data6.length;
              for (let i0 = 0; i0 < len0; i0++) {
                if (!validate46(data6[i0], { instancePath: instancePath + "/events/" + i0, parentData: data6, parentDataProperty: i0, rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate46.errors : vErrors.concat(validate46.errors);
                  errors = vErrors.length;
                }
              }
            } else {
              const err20 = { instancePath: instancePath + "/events", schemaPath: "#/properties/events/type", keyword: "type", params: { type: "array" }, message: "must be array" };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
          }
          if (data.traces !== void 0) {
            let data8 = data.traces;
            if (Array.isArray(data8)) {
              if (data8.length < 1) {
                const err21 = { instancePath: instancePath + "/traces", schemaPath: "#/properties/traces/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
              const len1 = data8.length;
              for (let i1 = 0; i1 < len1; i1++) {
                if (!validate48(data8[i1], { instancePath: instancePath + "/traces/" + i1, parentData: data8, parentDataProperty: i1, rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate48.errors : vErrors.concat(validate48.errors);
                  errors = vErrors.length;
                }
              }
            } else {
              const err22 = { instancePath: instancePath + "/traces", schemaPath: "#/properties/traces/type", keyword: "type", params: { type: "array" }, message: "must be array" };
              if (vErrors === null) {
                vErrors = [err22];
              } else {
                vErrors.push(err22);
              }
              errors++;
            }
          }
        } else {
          const err23 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err23];
          } else {
            vErrors.push(err23);
          }
          errors++;
        }
        validate50.errors = vErrors;
        return errors === 0;
      }
      validate50.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.Capabilities = validate54;
      function validate54(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate54.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.engine === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "engine" }, message: "must have required property 'engine'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          if (data.contract_sha256 === void 0) {
            const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "contract_sha256" }, message: "must have required property 'contract_sha256'" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "engine" || key0 === "contract_sha256")) {
              const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
          }
          if (data.engine !== void 0) {
            let data0 = data.engine;
            if (typeof data0 !== "string") {
              const err3 = { instancePath: instancePath + "/engine", schemaPath: "#/properties/engine/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
            if ("workload-engine-v1" !== data0) {
              const err4 = { instancePath: instancePath + "/engine", schemaPath: "#/properties/engine/const", keyword: "const", params: { allowedValue: "workload-engine-v1" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
          }
          if (data.contract_sha256 !== void 0) {
            let data1 = data.contract_sha256;
            if (typeof data1 === "string") {
              if (!pattern4.test(data1)) {
                const err5 = { instancePath: instancePath + "/contract_sha256", schemaPath: "#/properties/contract_sha256/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{64}$" }, message: 'must match pattern "^[0-9a-f]{64}$"' };
                if (vErrors === null) {
                  vErrors = [err5];
                } else {
                  vErrors.push(err5);
                }
                errors++;
              }
            } else {
              const err6 = { instancePath: instancePath + "/contract_sha256", schemaPath: "#/properties/contract_sha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
          }
        } else {
          const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
        validate54.errors = vErrors;
        return errors === 0;
      }
      validate54.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
      exports.ApiError = validate55;
      function validate55(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
        let vErrors = null;
        let errors = 0;
        const evaluated0 = validate55.evaluated;
        if (evaluated0.dynamicProps) {
          evaluated0.props = void 0;
        }
        if (evaluated0.dynamicItems) {
          evaluated0.items = void 0;
        }
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.error === void 0) {
            const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "error" }, message: "must have required property 'error'" };
            if (vErrors === null) {
              vErrors = [err0];
            } else {
              vErrors.push(err0);
            }
            errors++;
          }
          for (const key0 in data) {
            if (!(key0 === "error")) {
              const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err1];
              } else {
                vErrors.push(err1);
              }
              errors++;
            }
          }
          if (data.error !== void 0) {
            if (typeof data.error !== "string") {
              const err2 = { instancePath: instancePath + "/error", schemaPath: "#/properties/error/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
          }
        } else {
          const err3 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        validate55.errors = vErrors;
        return errors === 0;
      }
      validate55.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
    }
  });
  return require_contract_validators();
})();
