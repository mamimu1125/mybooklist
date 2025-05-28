import React, { useState, useEffect } from 'react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function App() {
  const [books, setBooks] = useState([]);
  const [genres] = useState([
    { id: 'fiction', name: '小説・文学' },
    { id: 'business', name: 'ビジネス・経済' },
    { id: 'tech', name: 'IT・技術書' },
    { id: 'essay', name: 'エッセイ・随筆' },
    { id: 'history', name: '歴史・伝記' },
    { id: 'science', name: '科学・医学' },
    { id: 'philosophy', name: '哲学・思想' },
    { id: 'hobby', name: '趣味・実用' },
    { id: 'other', name: 'その他' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('added');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: 'fiction',
    rating: 0,
    comment: '',
    favorite: false,
    description: '',
    publishedDate: '',
    pageCount: 0,
    thumbnail: '',
    amazonUrl: '' // Amazon URL追加
  });

  // 管理者のメールアドレス（実際の管理者メールに変更してください）
  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'your-admin-email@example.com';

  useEffect(() => {
    // Firebase認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // 管理者チェック
      if (firebaseUser && firebaseUser.email === ADMIN_EMAIL) {
        setUser(firebaseUser);
        console.log('管理者ログイン:', firebaseUser.email);
      } else if (firebaseUser) {
        // 管理者以外はログアウト
        console.log('権限のないユーザーのため自動ログアウト');
        handleLogout();
        alert('このアプリは管理者専用です。');
      } else {
        setUser(null);
      }
      // データは常に読み込み（閲覧用）
      loadBooksFromFirestore();
    });

    return () => unsubscribe();
  }, []);

  // Firestoreからデータを読み込み
  const loadBooksFromFirestore = async () => {
    try {
      const booksSnapshot = await getDocs(collection(db, 'books'));
      const firebaseBooks = booksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBooks(firebaseBooks);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      // エラー時は模擬データを表示
      loadMockData();
    }
  };

  // 模擬データ（Firebaseエラー時のフォールバック）
  const loadMockData = () => {
    const mockBooks = [
      {
        id: '1',
        title: '吾輩は猫である',
        author: '夏目漱石',
        isbn: '9784101010014',
        genre: 'fiction',
        rating: 4,
        comment: '猫の視点から見た人間社会の描写が秀逸。漱石の文体の美しさを再認識。',
        favorite: true,
        description: '中学校の英語教師である珍野苦沙弥の家に飼われている猫の視点で、明治時代の人間社会を風刺的に描いた代表作。',
        publishedDate: '1905-01-01',
        pageCount: 256,
        thumbnail: 'https://picsum.photos/300/450?random=1',
        addedDate: '2024-01-15T00:00:00.000Z'
      },
      {
        id: '2',
        title: 'リーダブルコード',
        author: 'Dustin Boswell, Trevor Foucher',
        isbn: '9784873115658',
        genre: 'tech',
        rating: 5,
        comment: 'プログラマー必読の書。コードの可読性について具体的で実践的なアドバイスが満載。',
        favorite: true,
        description: 'より良いコードを書くための実践的なテクニックを紹介。命名、コメント、制御フローなど、コードの品質向上に役立つ知識が詰まっている。',
        publishedDate: '2012-06-23',
        pageCount: 260,
        thumbnail: 'https://picsum.photos/300/450?random=2',
        addedDate: '2024-02-01T00:00:00.000Z'
      },
      {
        id: '3',
        title: 'FACTFULNESS',
        author: 'ハンス・ロスリング',
        isbn: '9784822255090',
        genre: 'business',
        rating: 4,
        comment: 'データに基づいた世界の見方を学べる良書。思い込みを正してくれる。',
        favorite: false,
        description: '私たちの世界認識がいかに偏見に満ちているかを、データを使って明らかにし、事実に基づいた正しい世界の見方を教えてくれる。',
        publishedDate: '2019-01-01',
        pageCount: 400,
        thumbnail: 'https://picsum.photos/300/450?random=3',
        addedDate: '2024-03-01T00:00:00.000Z'
      }
    ];
    setBooks(mockBooks);
  };

  // 管理者のみログイン機能
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // 管理者チェック
      if (result.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        alert('このアプリは管理者専用です。');
        return;
      }
      
      console.log('管理者ログイン成功:', result.user.email);
    } catch (error) {
      console.error('ログインエラー:', error);
      alert('ログインに失敗しました');
    }
  };

  // 実際のログアウト機能
  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (showAddForm) {
        resetForm();
      }
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // Google Books API検索（実際のAPI使用）
  const searchGoogleBooks = async (query) => {
    setIsLoading(true);
    
    const API_KEY = process.env.REACT_APP_GOOGLE_BOOKS_API_KEY;
    
    if (!API_KEY) {
      console.warn('Google Books API Key not found. Check your .env file.');
      console.warn('Expected: REACT_APP_GOOGLE_BOOKS_API_KEY=your_api_key');
      mockSearchResults(query);
      return;
    }

    try {
      // CORSエラー回避のため、より具体的なパラメータを使用
      const searchUrl = `https://www.googleapis.com/books/v1/volumes?` +
        `q=${encodeURIComponent(query)}` +
        `&key=${API_KEY}` +
        `&maxResults=10` +
        `&printType=books` +
        `&orderBy=relevance`;

      console.log('Searching Google Books API...');
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('API Key制限エラー: 日次制限に達した可能性があります');
        } else if (response.status === 400) {
          throw new Error('APIリクエストエラー: 検索クエリを確認してください');
        } else {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Google Books API Response:', data);
      
      if (data.items && data.items.length > 0) {
        setSearchResults(data.items);
        setShowSearchResults(true);
      } else {
        console.log('No results found from Google Books API');
        setSearchResults([]);
        setShowSearchResults(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Google Books API error:', error.message);
      console.log('Falling back to mock data...');
      // エラー時は模擬データを使用
      mockSearchResults(query);
    }
  };

  // 模擬検索結果（APIエラー時のフォールバック）
  const mockSearchResults = (query) => {
    console.log('Using mock search results for:', query);
    const mockResults = [
      {
        id: 'mock1',
        volumeInfo: {
          title: `${query}関連の本`,
          authors: ['著者名'],
          publishedDate: '2024-01-01',
          description: `${query}に関する興味深い内容を扱った書籍です。読者に新しい視点を提供します。`,
          pageCount: 300,
          imageLinks: {
            thumbnail: `https://picsum.photos/300/450?random=${Date.now()}`
          },
          industryIdentifiers: [{ type: 'ISBN_13', identifier: '9784000000000' }],
          categories: ['一般']
        }
      },
      {
        id: 'mock2',
        volumeInfo: {
          title: `${query}入門`,
          authors: ['専門家 太郎'],
          publishedDate: '2023-12-01',
          description: `${query}の基礎から応用まで幅広くカバーした入門書。初心者にもわかりやすく解説されています。`,
          pageCount: 250,
          imageLinks: {
            thumbnail: `https://picsum.photos/300/450?random=${Date.now() + 1}`
          },
          industryIdentifiers: [{ type: 'ISBN_13', identifier: '9784000000001' }],
          categories: ['教育']
        }
      }
    ];
    
    setTimeout(() => {
      setSearchResults(mockResults);
      setShowSearchResults(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await searchGoogleBooks(searchQuery);
  };

  // Google Books APIのカテゴリを日本語ジャンルにマッピング
  const mapGoogleBooksCategory = (categories) => {
    if (!categories || categories.length === 0) {
      return 'other'; // デフォルトは「その他」
    }
    
    // 最初のカテゴリを英語で取得
    const primaryCategory = categories[0].toLowerCase();
    
    // カテゴリマッピング
    const categoryMapping = {
      // 小説・文学
      'fiction': 'fiction',
      'literature': 'fiction',
      'literary fiction': 'fiction',
      'romance': 'fiction',
      'mystery': 'fiction',
      'thriller': 'fiction',
      'fantasy': 'fiction',
      'science fiction': 'fiction',
      'horror': 'fiction',
      'adventure': 'fiction',
      
      // ビジネス・経済
      'business': 'business',
      'economics': 'business',
      'finance': 'business',
      'management': 'business',
      'entrepreneurship': 'business',
      'marketing': 'business',
      'investing': 'business',
      
      // IT・技術書
      'computers': 'tech',
      'technology': 'tech',
      'programming': 'tech',
      'software': 'tech',
      'engineering': 'tech',
      'science': 'tech',
      'mathematics': 'tech',
      
      // エッセイ・随筆
      'biography': 'essay',
      'memoir': 'essay',
      'autobiography': 'essay',
      'essays': 'essay',
      'personal narratives': 'essay',
      
      // 歴史・伝記
      'history': 'history',
      'biography & autobiography': 'history',
      'historical': 'history',
      'war': 'history',
      'politics': 'history',
      
      // 科学・医学
      'medical': 'science',
      'health': 'science',
      'psychology': 'science',
      'nature': 'science',
      'physics': 'science',
      'chemistry': 'science',
      'biology': 'science',
      
      // 哲学・思想
      'philosophy': 'philosophy',
      'religion': 'philosophy',
      'spirituality': 'philosophy',
      'self-help': 'philosophy',
      
      // 趣味・実用
      'cooking': 'hobby',
      'crafts': 'hobby',
      'gardening': 'hobby',
      'sports': 'hobby',
      'travel': 'hobby',
      'art': 'hobby',
      'music': 'hobby',
      'photography': 'hobby',
      'games': 'hobby',
      'hobbies': 'hobby'
    };
    
    // 部分一致でカテゴリを検索
    for (const [key, value] of Object.entries(categoryMapping)) {
      if (primaryCategory.includes(key)) {
        return value;
      }
    }
    
    return 'other'; // マッチしない場合は「その他」
  };

  // Amazon URL生成関数
  const generateAmazonUrl = (title, author, isbn) => {
    const baseUrl = 'https://www.amazon.co.jp/s?k=';
    
    // ISBN優先でAmazon検索URL生成
    if (isbn) {
      return `${baseUrl}${encodeURIComponent(isbn)}&ref=nb_sb_noss`;
    }
    
    // ISBNがない場合はタイトル＋著者で検索
    if (title && author) {
      const searchQuery = `${title} ${author}`;
      return `${baseUrl}${encodeURIComponent(searchQuery)}&i=stripbooks&ref=nb_sb_noss`;
    }
    
    // タイトルのみの場合
    if (title) {
      return `${baseUrl}${encodeURIComponent(title)}&i=stripbooks&ref=nb_sb_noss`;
    }
    
    return '';
  };

  const selectFromSearch = (result) => {
    const volumeInfo = result.volumeInfo;
    const isbn = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || '';
    
    // カテゴリを自動でマッピング
    const autoGenre = mapGoogleBooksCategory(volumeInfo.categories);
    
    // Amazon URL生成
    const amazonUrl = generateAmazonUrl(
      volumeInfo.title,
      volumeInfo.authors?.join(', '),
      isbn
    );
    
    console.log('Original categories:', volumeInfo.categories);
    console.log('Mapped genre:', autoGenre);
    console.log('Generated Amazon URL:', amazonUrl);
    
    setNewBook({
      ...newBook,
      title: volumeInfo.title,
      author: volumeInfo.authors?.join(', ') || '',
      isbn: isbn,
      description: volumeInfo.description || '',
      publishedDate: volumeInfo.publishedDate || '',
      pageCount: volumeInfo.pageCount || 0,
      thumbnail: volumeInfo.imageLinks?.thumbnail || '',
      genre: autoGenre, // 自動設定されたジャンル
      amazonUrl: amazonUrl // Amazon URL
    });
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // フィルタリング＆ソート
  const filteredAndSortedBooks = (() => {
    const filtered = books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.comment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || book.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          if (a.rating === 0 && b.rating === 0) return 0;
          if (a.rating === 0) return 1;
          if (b.rating === 0) return -1;
          return b.rating - a.rating;
        case 'favorite':
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return b.rating - a.rating;
        case 'pages':
          return b.pageCount - a.pageCount;
        case 'year':
          const yearA = a.publishedDate ? new Date(a.publishedDate).getFullYear() : 0;
          const yearB = b.publishedDate ? new Date(b.publishedDate).getFullYear() : 0;
          return yearB - yearA;
        case 'author':
          return a.author.localeCompare(b.author);
        case 'added':
        default:
          return new Date(b.addedDate) - new Date(a.addedDate);
      }
    });

    return sorted;
  })();

  // 統計データ計算
  const getStats = () => {
    const totalBooks = books.length;
    const totalPages = books.reduce((sum, book) => sum + (book.pageCount || 0), 0);
    const averageRating = books.filter(book => book.rating > 0).reduce((sum, book, _, arr) => sum + book.rating / arr.length, 0);
    const favoriteBooks = books.filter(book => book.favorite).length;
    
    const currentYear = new Date().getFullYear();
    const thisYearBooks = books.filter(book => 
      book.addedDate && new Date(book.addedDate).getFullYear() === currentYear
    ).length;

    return {
      totalBooks,
      totalPages,
      averageRating: averageRating || 0,
      favoriteBooks,
      thisYearBooks
    };
  };

  const stats = getStats();

  // Firestoreへの本追加
  const handleAddBook = async () => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }
    
    try {
      const bookToAdd = {
        ...newBook,
        addedDate: new Date().toISOString(),
        userId: user.uid // ユーザーIDを追加
      };
      await addDoc(collection(db, 'books'), bookToAdd);
      await loadBooksFromFirestore();
      resetForm();
    } catch (error) {
      console.error('本の追加エラー:', error);
      alert('本の追加に失敗しました');
    }
  };

  // Firestoreの本更新
  const handleUpdateBook = async () => {
    if (!user || !editingId) {
      alert('ログインが必要です');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'books', editingId), newBook);
      await loadBooksFromFirestore();
      resetForm();
    } catch (error) {
      console.error('本の更新エラー:', error);
      alert('本の更新に失敗しました');
    }
  };

  // Firestoreから本削除
  const handleDeleteBook = async (id) => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }
    
    if (window.confirm('この本を削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'books', id));
        await loadBooksFromFirestore();
      } catch (error) {
        console.error('本の削除エラー:', error);
        alert('本の削除に失敗しました');
      }
    }
  };

  const resetForm = () => {
    setNewBook({
      title: '',
      author: '',
      isbn: '',
      genre: 'fiction',
      rating: 0,
      comment: '',
      favorite: false,
      description: '',
      publishedDate: '',
      pageCount: 0,
      thumbnail: '',
      amazonUrl: ''
    });
    setShowAddForm(false);
    setEditingId(null);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // お気に入り切り替え（Firestore）
  const toggleFavorite = async (id) => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }
    
    const book = books.find(b => b.id === id);
    if (book) {
      try {
        await updateDoc(doc(db, 'books', id), { favorite: !book.favorite });
        await loadBooksFromFirestore();
      } catch (error) {
        console.error('お気に入り更新エラー:', error);
        alert('お気に入りの更新に失敗しました');
      }
    }
  };

  const handleEditBook = (id) => {
    const book = books.find(b => b.id === id);
    if (book) {
      setNewBook(book);
      setEditingId(id);
      setShowAddForm(true);
    }
  };

  const openBookModal = (book) => {
    setSelectedBook(book);
  };

  const closeBookModal = () => {
    setSelectedBook(null);
  };

  // 星評価コンポーネント（HTML エンティティ使用）
  const StarRating = ({ rating, onRatingChange, readonly = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRatingChange && onRatingChange(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform text-lg`}
            disabled={readonly}
          >
            <span className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">MyBookList</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded hover:border-blue-500 hover:text-blue-600"
              >
                {'📊'} 統計
              </button>
              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    {user.displayName || user.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:border-red-500 hover:text-red-600"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {showStats && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {'📈'} 読書統計
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalBooks}</div>
                <div className="text-xs text-gray-500">総登録数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalPages.toLocaleString()}</div>
                <div className="text-xs text-gray-500">総ページ数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{stats.averageRating.toFixed(1)}</div>
                <div className="text-xs text-gray-500">平均評価</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.favoriteBooks}</div>
                <div className="text-xs text-gray-500">お気に入り</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.thisYearBooks}</div>
                <div className="text-xs text-gray-500">今年の登録</div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="本を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedGenre('all')}
              className={`px-3 py-2 text-sm rounded-full transition-colors ${
                selectedGenre === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
              }`}
            >
              すべて ({books.length})
            </button>
            {genres.map(genre => {
              const count = books.filter(book => book.genre === genre.id).length;
              return (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`px-3 py-2 text-sm rounded-full transition-colors ${
                    selectedGenre === genre.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {genre.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="added">登録順</option>
            <option value="rating">評価順</option>
            <option value="favorite">お気に入り順</option>
            <option value="pages">ページ数順</option>
            <option value="year">出版年順</option>
            <option value="author">著者順</option>
          </select>
          
          <div className="flex-1"></div>
          
          {user && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 shadow-sm"
            >
              {'➕'} 本を追加
            </button>
          )}
        </div>

        {showAddForm && user && (
          <div className="mb-6 p-6 bg-white border border-gray-300 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? '本の編集' : '本の追加'}
            </h3>
            
            {!editingId && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">本を検索（Google Books）</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="書籍名や著者名を入力..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? '検索中...' : '検索'}
                  </button>
                </div>
              </div>
            )}

            {showSearchResults && (
              <div className="mb-4 max-h-64 overflow-y-auto border border-gray-200 rounded">
                {searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <div key={result.id} className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                         onClick={() => selectFromSearch(result)}>
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                            {result.volumeInfo.imageLinks?.thumbnail ? (
                              <img 
                                src={result.volumeInfo.imageLinks.thumbnail}
                                alt={result.volumeInfo.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">{'📖'}</span>
                            )}
                          </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{result.volumeInfo.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{result.volumeInfo.authors?.join(', ') || '著者不明'}</span>
                            <span>•</span>
                            <span>{result.volumeInfo.publishedDate || '不明'}</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {result.volumeInfo.description?.substring(0, 100) || '説明なし'}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    検索結果が見つかりませんでした
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {(newBook.description || newBook.thumbnail) && (
                <div className="flex gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="w-20 h-28 bg-gray-200 rounded overflow-hidden">
                    {newBook.thumbnail ? (
                      <img
                        src={newBook.thumbnail}
                        alt={newBook.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                        {'📖'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{newBook.title}</h4>
                    <p className="text-sm text-gray-600 mb-1">{newBook.author}</p>
                    <p className="text-sm text-gray-600 mb-2">{newBook.publishedDate} • {newBook.pageCount}ページ</p>
                    {newBook.description && (
                      <p className="text-sm text-gray-700 line-clamp-3">{newBook.description}</p>
                    )}
                    {newBook.amazonUrl && (
                      <div className="mt-2">
                        <a 
                          href={newBook.amazonUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 hover:underline"
                        >
                          🛒 Amazonで見る
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                  <input
                    type="text"
                    placeholder="書籍タイトル"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">著者</label>
                  <input
                    type="text"
                    placeholder="著者名"
                    value={newBook.author}
                    onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ジャンル</label>
                  <select
                    value={newBook.genre}
                    onChange={(e) => setNewBook({...newBook, genre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    {genres.map(genre => (
                      <option key={genre.id} value={genre.id}>{genre.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ページ数</label>
                  <input
                    type="number"
                    placeholder="ページ数"
                    value={newBook.pageCount}
                    onChange={(e) => setNewBook({...newBook, pageCount: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">評価</label>
                <StarRating 
                  rating={newBook.rating} 
                  onRatingChange={(rating) => setNewBook({...newBook, rating})} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">感想・メモ</label>
                <textarea
                  placeholder="読書感想やメモを記入"
                  value={newBook.comment}
                  onChange={(e) => setNewBook({...newBook, comment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
                  rows="3"
                />
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newBook.favorite}
                  onChange={(e) => setNewBook({...newBook, favorite: e.target.checked})}
                  className="mr-2 rounded"
                />
                <span className="text-sm">お気に入り</span>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={editingId ? handleUpdateBook : handleAddBook}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingId ? '更新' : '追加'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded hover:border-black"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredAndSortedBooks.map(book => {
            const genreInfo = genres.find(g => g.id === book.genre);
            
            return (
              <div key={book.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  {book.thumbnail ? (
                    <img
                      src={book.thumbnail}
                      alt={book.title}
                      className="w-full h-48 sm:h-56 lg:h-64 object-cover cursor-pointer"
                      onClick={() => openBookModal(book)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-48 sm:h-56 lg:h-64 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white cursor-pointer text-4xl ${book.thumbnail ? 'hidden' : 'flex'}`}
                    onClick={() => openBookModal(book)}
                  >
                    {'📖'}
                  </div>
                  
                  {book.favorite && (
                    <span className="absolute top-2 left-2 text-red-500 text-lg">❤️</span>
                  )}
                </div>
                
                <div className="p-2 sm:p-3">
                  <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">{book.author}</p>
                  
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-500">
                      {book.pageCount > 0 ? `${book.pageCount}ページ` : ''}
                    </span>
                    {book.publishedDate && (
                      <span className="text-gray-500">
                        {new Date(book.publishedDate).getFullYear()}年
                      </span>
                    )}
                  </div>
                  
                  {book.rating > 0 && (
                    <div className="mb-2 scale-75 sm:scale-90 origin-left">
                      <StarRating rating={book.rating} readonly />
                    </div>
                  )}
                  
                  {book.comment && (
                    <p className="text-gray-500 text-xs mb-2 line-clamp-2">{book.comment}</p>
                  )}
                  
                  {/* Amazon URL */}
                  {book.amazonUrl && (
                    <div className="mb-2">
                      <a 
                        href={book.amazonUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 hover:underline"
                      >
                        🛒 Amazon
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                      {genreInfo?.name || book.genre}
                    </span>
                    
                    <div className="flex gap-1">
                      {user && (
                        <>
                          <button
                            onClick={() => toggleFavorite(book.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="お気に入り"
                          >
                            <span className={`text-sm ${book.favorite ? 'text-red-500' : 'text-gray-400'}`}>
                              ❤️
                            </span>
                          </button>
                          
                          <button
                            onClick={() => handleEditBook(book.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="編集"
                          >
                            <span className="text-sm">✏️</span>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="p-1 hover:bg-gray-100 rounded text-red-500"
                            title="削除"
                          >
                            <span className="text-sm">🗑️</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAndSortedBooks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{'📚'}</div>
            <p className="text-gray-500 text-lg">本が見つかりません</p>
            {user ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                最初の本を追加
              </button>
            ) : (
              <div className="mt-4 text-gray-500 text-sm text-center">
                このサイトは閲覧専用です
              </div>
            )}
          </div>
        )}
      </div>

      {/* 管理者専用フローティングボタン */}
      {!user && (
        <div className="fixed bottom-4 right-4">
          <button
            onClick={handleLogin}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 text-xs opacity-50 hover:opacity-100 transition-opacity"
            title="管理者専用ログイン"
          >
            👑 管理者
          </button>
        </div>
      )}

      {selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold pr-4">{selectedBook.title}</h3>
                <button
                  onClick={closeBookModal}
                  className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="flex gap-4 mb-4">
                {selectedBook.thumbnail ? (
                  <img
                    src={selectedBook.thumbnail}
                    alt={selectedBook.title}
                    className="w-32 h-48 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-32 h-48 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center text-white text-4xl ${selectedBook.thumbnail ? 'hidden' : 'flex'}`}>
                  {'📖'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {'👤'}
                    <span className="text-gray-700">{selectedBook.author}</span>
                  </div>
                  
                  {selectedBook.publishedDate && (
                    <div className="flex items-center gap-2 mb-2">
                      {'📅'}
                      <span className="text-gray-700">{new Date(selectedBook.publishedDate).getFullYear()}年</span>
                    </div>
                  )}
                  
                  {selectedBook.pageCount > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      {'📄'}
                      <span className="text-gray-700">{selectedBook.pageCount}ページ</span>
                    </div>
                  )}
                  
                  {selectedBook.rating > 0 && (
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-1">あなたの評価</div>
                      <StarRating rating={selectedBook.rating} readonly />
                    </div>
                  )}
                </div>
              </div>
              
              {selectedBook.description && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2 text-gray-800">あらすじ</h4>
                  <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-300">
                    <p className="text-gray-700 text-sm leading-relaxed">{selectedBook.description}</p>
                  </div>
                </div>
              )}
              
              {selectedBook.comment && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2 text-gray-800">感想・メモ</h4>
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-300">
                    <p className="text-gray-700 text-sm leading-relaxed">{selectedBook.comment}</p>
                  </div>
                </div>
              )}
              
              {/* Amazon URL */}
              {selectedBook.amazonUrl && (
                <div className="mb-4">
                  <a 
                    href={selectedBook.amazonUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    🛒 Amazonで購入・詳細を見る
                  </a>
                </div>
              )}
              
              {selectedBook.isbn && (
                <div className="text-xs text-gray-500">
                  ISBN: {selectedBook.isbn}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;