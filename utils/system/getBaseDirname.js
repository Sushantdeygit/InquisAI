import path from 'path';

function getBaseDirname() {
  return path.resolve(process.cwd());
}

export { getBaseDirname };
