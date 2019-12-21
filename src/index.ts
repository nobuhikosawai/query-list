import ts from 'typescript';
import fs from 'fs';
import { join } from 'path';
import { findQueryFilenamAndNode } from './util';

const targetDir = './example';
const tsconfigFilePath = './example/tsconfig.json';

const filelist = fs.readdirSync(join(targetDir, 'src'), { withFileTypes: true });

function isDefined<T>(argument: T | undefined): argument is T {
  return argument !== undefined
}

const tsFileList = filelist.map(file => {
  if (/.*\.(tsx|ts)$/.test(file.name)) {
    return join(targetDir, `src/${file.name}`)
  }
}).filter(isDefined);

const tsconfig = ts.parseConfigFileTextToJson(tsconfigFilePath, fs.readFileSync(tsconfigFilePath).toString()).config;
const program = ts.createProgram(tsFileList, tsconfig);

const res = findQueryFilenamAndNode(program);
console.log(res);
