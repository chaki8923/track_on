import * as diff from 'diff';

export type DiffResult = {
  hasChanges: boolean;
  changesCount: number;
  addedLines: string[];
  removedLines: string[];
  summary: string;
};

/**
 * 2つのHTML（テキスト）を比較して差分を抽出
 */
export function compareContent(
  oldContent: string,
  newContent: string
): DiffResult {
  const changes = diff.diffLines(oldContent, newContent);

  const addedLines: string[] = [];
  const removedLines: string[] = [];
  let changesCount = 0;

  changes.forEach((part) => {
    if (part.added) {
      const lines = part.value.split('\n').filter((l) => l.trim().length > 0);
      addedLines.push(...lines);
      changesCount += lines.length;
    } else if (part.removed) {
      const lines = part.value.split('\n').filter((l) => l.trim().length > 0);
      removedLines.push(...lines);
      changesCount += lines.length;
    }
  });

  // サマリーを生成（変更箇所数ベース）
  let summary = '';
  if (changesCount === 0) {
    summary = '変更なし';
  } else if (changesCount < 10) {
    summary = '軽微な変更';
  } else if (changesCount < 50) {
    summary = '中程度の変更';
  } else {
    summary = '大幅な変更';
  }

  return {
    hasChanges: changesCount > 0,
    changesCount,
    addedLines: addedLines.slice(0, 10), // 最大10行
    removedLines: removedLines.slice(0, 10),
    summary,
  };
}

/**
 * 差分から重要度を判定（変更箇所数ベース）
 */
export function calculateImportance(diffResult: DiffResult): 'high' | 'medium' | 'low' {
  const { changesCount } = diffResult;

  // 大幅な変更
  if (changesCount > 50) {
    return 'high';
  }

  // 中程度の変更
  if (changesCount > 10) {
    return 'medium';
  }

  // 軽微な変更
  return 'low';
}

