#!/usr/bin/env python3
"""
Check GPU/CUDA availability and system information.
"""

import torch
import sys

def check_gpu_availability():
    """Check GPU availability and system info."""
    
    print("🔍 GPU/CUDA Availability Check")
    print("=" * 50)
    
    # Python version
    print(f"Python version: {sys.version}")
    
    # PyTorch version
    print(f"PyTorch version: {torch.__version__}")
    
    # CUDA availability
    cuda_available = torch.cuda.is_available()
    print(f"CUDA available: {cuda_available}")
    
    if cuda_available:
        # GPU information
        gpu_count = torch.cuda.device_count()
        print(f"GPU count: {gpu_count}")
        
        for i in range(gpu_count):
            gpu_name = torch.cuda.get_device_name(i)
            gpu_memory = torch.cuda.get_device_properties(i).total_memory / 1024**3
            print(f"GPU {i}: {gpu_name} ({gpu_memory:.1f} GB)")
        
        # Current device
        current_device = torch.cuda.current_device()
        print(f"Current device: {current_device}")
        
        # CUDA version
        cuda_version = torch.version.cuda
        print(f"CUDA version: {cuda_version}")
        
    else:
        print("❌ CUDA not available")
        print("   Possible reasons:")
        print("   1. No NVIDIA GPU installed")
        print("   2. CUDA toolkit not installed")
        print("   3. PyTorch not compiled with CUDA support")
        print("   4. Driver issues")
    
    # Check for Apple Silicon
    if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        print("✅ Apple Silicon MPS available")
    else:
        print("❌ Apple Silicon MPS not available")
    
    # Check PyTorch build
    print(f"PyTorch built with CUDA: {torch.version.cuda is not None}")
    
    return cuda_available

if __name__ == "__main__":
    check_gpu_availability()
