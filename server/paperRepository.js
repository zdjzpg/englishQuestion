const { getPool } = require('./db');
const studentValidation = require('../src/shared/studentValidation');
const paperValidation = require('../src/shared/paperValidation');
const paperEditPolicy = require('../src/shared/paperEditPolicy');
const questionAbilities = require('../src/shared/questionAbilities');
const studentExperience = require('../src/shared/studentExperience');

const { getMissingStudentFields } = studentValidation;
const { getPaperScoreSummary } = paperValidation;
const { canEditPaper, getPaperEditBlockedMessage } = paperEditPolicy;
const { getDefaultAbilitiesForType, normalizeQuestionAbilities } = questionAbilities;
const { normalizeRewardConfig, pickRewardItem } = studentExperience;

function parseQuestionRow(row) {
  return {
    id: String(row.id),
    type: row.question_type,
    score: Number(row.score),
    prompt: row.prompt || ''
  };
}

function hydrateQuestion(row) {
  const base = parseQuestionRow(row);
  const content = typeof row.content_json === 'string'
    ? JSON.parse(row.content_json)
    : row.content_json;
  return { ...base, ...content };
}

function buildQuestionContent(question, content) {
  return {
    abilities: normalizeQuestionAbilities(question.abilities, getDefaultAbilitiesForType(question.type)),
    ...content
  };
}

function applyOwnerScope({ authUser, alias = 'p' }) {
  if (!authUser || authUser.role === 'ADMIN') {
    return { clause: '', params: [] };
  }
  return {
    clause: ` AND ${alias}.owner_user_id = ?`,
    params: [authUser.id]
  };
}

async function ensurePaperAccess(connection, paperId, authUser) {
  const [[paper]] = await connection.query('SELECT id, owner_user_id FROM papers WHERE id = ?', [paperId]);
  if (!paper) {
    return null;
  }
  if (authUser.role !== 'ADMIN' && String(paper.owner_user_id) !== String(authUser.id)) {
    const error = new Error('You do not have access to this paper.');
    error.statusCode = 403;
    throw error;
  }
  return paper;
}

function normalizeQuestionPayload(question, index) {
  const base = {
    prompt: question.prompt || '',
    score: Number(question.score || 0)
  };

  if (question.type === 'listen_choose_image') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        choices: Array.isArray(question.choices) ? question.choices : [],
        correctChoiceId: question.correctChoiceId || '',
        answerWord: question.answerWord || question.answer || ''
      }))
    };
  }

  if (question.type === 'listen_follow_instruction') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        instructionText: question.instructionText || '',
        imageUrl: question.imageUrl || '',
        mode: question.mode || 'tap',
        draggableObject: question.draggableObject || {},
        targets: Array.isArray(question.targets) ? question.targets : [],
        correctTargetId: question.correctTargetId || '',
        autoPlay: question.autoPlay !== false
      }))
    };
  }

  if (question.type === 'look_choose_word') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        imageUrl: question.imageUrl || '',
        choices: Array.isArray(question.choices) ? question.choices : [],
        correctChoiceId: question.correctChoiceId || '',
        targetWord: question.targetWord || ''
      }))
    };
  }

  if (question.type === 'sentence_sort') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        sentence: question.sentence || ''
      }))
    };
  }

  if (question.type === 'read_aloud') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        phrase: question.phrase || '',
        mascotWord: question.mascotWord || ''
      }))
    };
  }

  if (question.type === 'listen_answer_question') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        questionText: question.questionText || '',
        answerKeywordsText: question.answerKeywordsText || '',
        minMatchCount: Number(question.minMatchCount || 1),
        autoPlay: question.autoPlay !== false
      }))
    };
  }

  if (question.type === 'listen_choose_letter') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        targetLetter: question.targetLetter || '',
        candidateLettersText: question.candidateLettersText || '',
        requireBothCases: question.requireBothCases === true,
        autoPlay: question.autoPlay !== false
      }))
    };
  }

  if (question.type === 'read_sentence_with_image') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        imageUrl: question.imageUrl || '',
        sentenceText: question.sentenceText || '',
        autoPlay: question.autoPlay === true
      }))
    };
  }

  if (question.type === 'match_image_word') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        pairs: Array.isArray(question.pairs) ? question.pairs : []
      }))
    };
  }

  return {
    sortNo: index + 1,
    type: question.type,
    prompt: base.prompt,
    score: base.score,
    contentJson: JSON.stringify(buildQuestionContent(question, {
      answerWord: question.answerWord || '',
      blankIndexesText: question.blankIndexesText || ''
    }))
  };
}

async function listPapers({ keyword = '', questionType = '', authUser } = {}) {
  const pool = getPool();
  const conditions = ['1 = 1'];
  const params = [];
  const ownerScope = applyOwnerScope({ authUser, alias: 'p' });

  if (keyword) {
    conditions.push('p.title LIKE ?');
    params.push(`%${keyword}%`);
  }

  if (questionType) {
    conditions.push(`EXISTS (
      SELECT 1
      FROM paper_questions pqf
      WHERE pqf.paper_id = p.id
        AND pqf.question_type = ?
    )`);
    params.push(questionType);
  }

  if (ownerScope.clause) {
    conditions.push(ownerScope.clause.replace(/^ AND /, ''));
    params.push(...ownerScope.params);
  }

  const [rows] = await pool.query(
    `
      SELECT
        p.id,
        p.title,
        p.theme_note,
        p.welcome_speech,
        p.question_count,
        p.total_score,
        p.status,
        p.updated_at,
        p.owner_user_id,
        p.share_code,
        u.username AS owner_username,
        COUNT(s.id) AS submission_count
      FROM papers p
      LEFT JOIN submissions s ON s.paper_id = p.id
      LEFT JOIN users u ON u.id = p.owner_user_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY
        p.id,
        p.title,
        p.theme_note,
        p.welcome_speech,
        p.question_count,
        p.total_score,
        p.status,
        p.updated_at,
        p.owner_user_id,
        p.share_code,
        u.username
      ORDER BY p.updated_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    id: String(row.id),
    examTitle: row.title,
    themeNote: row.theme_note || '',
    welcomeSpeech: row.welcome_speech || '',
    questionCount: Number(row.question_count),
    totalScore: Number(row.total_score),
    updatedAt: row.updated_at,
    submissionCount: Number(row.submission_count),
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : '',
    ownerUsername: row.owner_username || '',
    shareCode: row.share_code || ''
  }));
}

async function getPaperById(paperId) {
  const pool = getPool();
  const [[paper]] = await pool.query(
    `
      SELECT
        id,
        title,
        theme_note,
        welcome_speech,
        question_count,
        total_score,
        updated_at,
        owner_user_id,
        share_code,
        reward_config_json,
        comment_config_json,
        (
          SELECT COUNT(1)
          FROM submissions s
          WHERE s.paper_id = papers.id
        ) AS submission_count
      FROM papers
      WHERE id = ?
    `,
    [paperId]
  );

  if (!paper) {
    return null;
  }

  const [questionRows] = await pool.query(
    `
      SELECT
        id,
        sort_no,
        question_type,
        prompt,
        score,
        content_json
      FROM paper_questions
      WHERE paper_id = ?
      ORDER BY sort_no ASC
    `,
    [paperId]
  );

  return {
    id: String(paper.id),
    examTitle: paper.title,
    themeNote: paper.theme_note || '',
    welcomeSpeech: paper.welcome_speech || '',
    questionCount: Number(paper.question_count),
    totalScore: Number(paper.total_score),
    updatedAt: paper.updated_at,
    ownerUserId: paper.owner_user_id ? String(paper.owner_user_id) : '',
    shareCode: paper.share_code || '',
    rewardConfig: normalizeRewardConfig(
      typeof paper.reward_config_json === 'string' && paper.reward_config_json
        ? JSON.parse(paper.reward_config_json)
        : paper.reward_config_json || {}
    ),
    commentConfig: typeof paper.comment_config_json === 'string' && paper.comment_config_json
      ? JSON.parse(paper.comment_config_json)
      : paper.comment_config_json || {},
    submissionCount: Number(paper.submission_count || 0),
    questions: questionRows.map(hydrateQuestion)
  };
}

async function getPaperByShareCode(shareCode) {
  const pool = getPool();
  const [[row]] = await pool.query('SELECT id FROM papers WHERE share_code = ? LIMIT 1', [shareCode]);
  if (!row) {
    return null;
  }
  return getPaperById(row.id);
}

async function generateUniqueShareCode(connection) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const shareCode = String(Math.floor(100000 + Math.random() * 900000));
    const [[existing]] = await connection.query('SELECT id FROM papers WHERE share_code = ? LIMIT 1', [shareCode]);
    if (!existing) {
      return shareCode;
    }
  }
  throw new Error('Failed to generate unique share code.');
}

async function savePaper({ paperId = null, examTitle, themeNote, welcomeSpeech, rewardConfig = {}, commentConfig = {}, questions, authUser }) {
  const scoreSummary = getPaperScoreSummary(questions);
  if (!scoreSummary.isValid) {
    const error = new Error(scoreSummary.message);
    error.statusCode = 400;
    throw error;
  }

  const normalizedRewardConfig = normalizeRewardConfig(rewardConfig);
  const pool = getPool();
  const connection = await pool.getConnection();
  const questionCount = questions.length;
  const totalScore = scoreSummary.total;

  try {
    await connection.beginTransaction();

    let resolvedPaperId = paperId;
    let ownerUserId = String(authUser.id);

    if (paperId) {
      const existingPaper = await ensurePaperAccess(connection, paperId, authUser);
      if (!existingPaper) {
        const error = new Error('Paper not found');
        error.statusCode = 404;
        throw error;
      }
      const [[submissionRow]] = await connection.query(
        'SELECT COUNT(1) AS submission_count FROM submissions WHERE paper_id = ?',
        [paperId]
      );
      if (!canEditPaper({ submissionCount: Number(submissionRow?.submission_count || 0) })) {
        const error = new Error(getPaperEditBlockedMessage());
        error.statusCode = 400;
        throw error;
      }
      ownerUserId = String(existingPaper.owner_user_id);
      await connection.query(
        `
          UPDATE papers
          SET
            title = ?,
            theme_note = ?,
            welcome_speech = ?,
            question_count = ?,
            total_score = ?,
            owner_user_id = ?,
            reward_config_json = ?,
            comment_config_json = ?
          WHERE id = ?
        `,
        [examTitle, themeNote, welcomeSpeech, questionCount, totalScore, ownerUserId, JSON.stringify(normalizedRewardConfig), JSON.stringify(commentConfig || {}), paperId]
      );

      await connection.query('DELETE FROM paper_questions WHERE paper_id = ?', [paperId]);
    } else {
      const shareCode = await generateUniqueShareCode(connection);
      const [result] = await connection.query(
        `
          INSERT INTO papers (
            title,
            theme_note,
            welcome_speech,
            question_count,
            total_score,
            owner_user_id,
            share_code,
            reward_config_json,
            comment_config_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [examTitle, themeNote, welcomeSpeech, questionCount, totalScore, ownerUserId, shareCode, JSON.stringify(normalizedRewardConfig), JSON.stringify(commentConfig || {})]
      );
      resolvedPaperId = result.insertId;
    }

    for (let index = 0; index < questions.length; index += 1) {
      const item = normalizeQuestionPayload(questions[index], index);
      await connection.query(
        `
          INSERT INTO paper_questions (
            paper_id,
            sort_no,
            question_type,
            prompt,
            score,
            content_json
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [resolvedPaperId, item.sortNo, item.type, item.prompt, item.score, item.contentJson]
      );
    }

    await connection.commit();
    return getPaperById(resolvedPaperId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deletePaper(paperId, authUser) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const paper = await ensurePaperAccess(connection, paperId, authUser);
    if (!paper) {
      const error = new Error('Paper not found');
      error.statusCode = 404;
      throw error;
    }
    await connection.query('DELETE FROM papers WHERE id = ?', [paperId]);
  } finally {
    connection.release();
  }
}

async function copyPaper(paperId, authUser) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const paper = await ensurePaperAccess(connection, paperId, authUser);
    if (!paper) {
      return null;
    }
  } finally {
    connection.release();
  }

  const sourcePaper = await getPaperById(paperId);
  if (!sourcePaper) {
    return null;
  }

  return savePaper({
    examTitle: `${sourcePaper.examTitle} - 复制`,
    themeNote: sourcePaper.themeNote,
    welcomeSpeech: sourcePaper.welcomeSpeech,
    rewardConfig: sourcePaper.rewardConfig,
    commentConfig: sourcePaper.commentConfig,
    questions: sourcePaper.questions,
    authUser
  });
}

async function saveSubmission({
  paperId,
  student,
  report,
  records
}) {
  const missingFields = getMissingStudentFields(student);
  if (missingFields.length) {
    const error = new Error(`Missing required student fields: ${missingFields.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[paper]] = await connection.query('SELECT owner_user_id FROM papers WHERE id = ?', [paperId]);
    if (!paper) {
      const error = new Error('Paper not found');
      error.statusCode = 404;
      throw error;
    }

    const [submissionResult] = await connection.query(
      `
        INSERT INTO submissions (
          paper_id,
          owner_user_id,
            student_name,
            student_phone,
            student_age,
            student_grade,
            student_school,
            total_score,
            total_possible_score,
            percent_score,
            report_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            paperId,
            paper.owner_user_id,
            student.name || '',
            student.phone || '',
            student.age || '',
            student.grade || '',
            student.school || '',
            Number(report.total || 0),
            Number(report.totalPossible || 0),
            Number(report.percent || 0),
            JSON.stringify(report)
      ]
    );

    const submissionId = submissionResult.insertId;

    const [questionRows] = await connection.query(
      `
        SELECT id, sort_no, question_type, prompt, score, content_json
        FROM paper_questions
        WHERE paper_id = ?
        ORDER BY sort_no ASC
      `,
      [paperId]
    );

    for (let index = 0; index < questionRows.length; index += 1) {
      const questionRow = questionRows[index];
      const record = records[index] || {};
      await connection.query(
        `
          INSERT INTO submission_answers (
            submission_id,
            paper_question_id,
            sort_no,
            question_type,
            prompt,
            student_answer_json,
            correct_answer_json,
            gained_score,
            total_score,
            answer_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          submissionId,
          questionRow.id,
          questionRow.sort_no,
          questionRow.question_type,
          questionRow.prompt,
          JSON.stringify({ studentText: record.studentText || '' }),
          JSON.stringify({ correctText: record.correctText || '' }),
          Number(record.gained || 0),
          Number(record.total || 0),
          record.status === '通过' ? 'PASS' : 'WARN'
        ]
      );
    }

    await connection.commit();
    return { id: String(submissionId), reward: null };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listSubmissionsByPaper(paperId, studentKeyword = '', authUser) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const paper = await ensurePaperAccess(connection, paperId, authUser);
    if (!paper) {
      return [];
    }

    const params = [paperId];
    let keywordClause = '';

    if (studentKeyword) {
      keywordClause = `
        AND (
          s.student_name LIKE ?
          OR s.student_phone LIKE ?
        )
      `;
      params.push(`%${studentKeyword}%`, `%${studentKeyword}%`);
    }

    const [submissionRows] = await connection.query(
      `
        SELECT
          s.id,
          s.paper_id,
          p.title AS paper_title,
              s.student_name,
              s.student_phone,
              s.student_age,
              s.student_grade,
              s.student_school,
              s.total_score,
              s.total_possible_score,
              s.percent_score,
          s.submitted_at,
          s.reward_json
        FROM submissions s
        INNER JOIN papers p ON p.id = s.paper_id
        WHERE s.paper_id = ?
        ${keywordClause}
        ORDER BY s.submitted_at DESC
      `,
      params
    );

    if (!submissionRows.length) {
      return [];
    }

    const submissionIds = submissionRows.map((item) => item.id);
    const [answerRows] = await connection.query(
      `
        SELECT
          submission_id,
          sort_no,
          question_type,
          prompt,
          student_answer_json,
          correct_answer_json,
          gained_score,
          total_score,
          answer_status
        FROM submission_answers
        WHERE submission_id IN (${submissionIds.map(() => '?').join(', ')})
        ORDER BY submission_id ASC, sort_no ASC
      `,
      submissionIds
    );

    return submissionRows.map((row) => {
      const records = answerRows
        .filter((answer) => answer.submission_id === row.id)
        .map((answer) => {
          const studentAnswer = typeof answer.student_answer_json === 'string'
            ? JSON.parse(answer.student_answer_json)
            : answer.student_answer_json;
          const correctAnswer = typeof answer.correct_answer_json === 'string'
            ? JSON.parse(answer.correct_answer_json)
            : answer.correct_answer_json;

          return {
            index: Number(answer.sort_no),
            meta: { label: answer.question_type },
            prompt: answer.prompt || '',
            studentText: studentAnswer?.studentText || '',
            correctText: correctAnswer?.correctText || '',
            gained: Number(answer.gained_score),
            total: Number(answer.total_score),
            status: answer.answer_status === 'PASS' ? '通过' : '待加强'
          };
        });

      return {
        id: String(row.id),
        paperId: String(row.paper_id),
        paperTitle: row.paper_title,
            student: {
              name: row.student_name || '',
              phone: row.student_phone || '',
              age: row.student_age || '',
              grade: row.student_grade || '',
              school: row.student_school || ''
            },
        submittedAt: row.submitted_at,
        report: {
          total: Number(row.total_score),
          totalPossible: Number(row.total_possible_score),
          percent: Number(row.percent_score)
        },
        reward: typeof row.reward_json === 'string' && row.reward_json ? JSON.parse(row.reward_json) : null,
        records
      };
    });
  } finally {
    connection.release();
  }
}

async function drawRewardForSubmission(submissionId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const [[row]] = await connection.query(
      `
        SELECT
          s.id,
          s.reward_json,
          p.reward_config_json
        FROM submissions s
        INNER JOIN papers p ON p.id = s.paper_id
        WHERE s.id = ?
        LIMIT 1
      `,
      [submissionId]
    );

    if (!row) {
      const error = new Error('Submission not found');
      error.statusCode = 404;
      throw error;
    }

    if (row.reward_json) {
      const reward = typeof row.reward_json === 'string' ? JSON.parse(row.reward_json) : row.reward_json;
      return { submissionId: String(row.id), reward, alreadyDrawn: true };
    }

    const rewardConfig = normalizeRewardConfig(
      typeof row.reward_config_json === 'string' && row.reward_config_json
        ? JSON.parse(row.reward_config_json)
        : row.reward_config_json || {}
    );

    if (!rewardConfig.enabled || !rewardConfig.items.length) {
      return { submissionId: String(row.id), reward: null, alreadyDrawn: false };
    }

    const reward = pickRewardItem(rewardConfig, Math.random());
    await connection.query(
      'UPDATE submissions SET reward_json = ? WHERE id = ?',
      [JSON.stringify(reward), submissionId]
    );

    return { submissionId: String(row.id), reward, alreadyDrawn: false };
  } finally {
    connection.release();
  }
}

module.exports = {
  listPapers,
  getPaperById,
  getPaperByShareCode,
  savePaper,
  deletePaper,
  copyPaper,
  saveSubmission,
  listSubmissionsByPaper,
  drawRewardForSubmission
};
