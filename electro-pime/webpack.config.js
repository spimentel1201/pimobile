const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'app/index.web.tsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.web.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules\/(?!(@expo\/vector-icons|react-native-vector-icons)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-typescript'],
            plugins: ['@babel/plugin-proposal-class-properties']
          }
        }
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'assets/'
          }
        }
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ],
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      '@expo/vector-icons': 'react-native-vector-icons',
      '@expo/vector-icons/MaterialCommunityIcons': 'react-native-vector-icons/MaterialCommunityIcons'
    },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
    fallback: {
      'react-native-vector-icons/MaterialCommunityIcons': false
    }
  },
  devServer: {
    historyApiFallback: true,
    hot: true
  }
};