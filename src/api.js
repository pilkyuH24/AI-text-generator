const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const newText = draftText;
      setDraftText('');
  
      setTexts((prevTexts) => {
        const existingText = prevTexts[prevTexts.length - 1];
        return [existingText, newText];
      });
  
      setPositions([
        [0, 10, 0],
        [0, -10, 0],
      ]);
  
      setTimeout(async () => {
        textParticlesRef.current.chaosParticles();
  
        const word1 = texts[texts.length - 1];
        const word2 = newText;
  
        try {
          const combinedWord = await generateCombinedWord(word1, word2);
  
          // 새로운 단어를 texts와 positions에 업데이트
          setTexts([combinedWord]);
          setPositions([[0, 10, 0]]);
        } catch (error) {
          console.error('단어 생성 중 오류 발생:', error);
          // 오류 처리 로직 추가
        }
      }, 3000);
    }
  };
  